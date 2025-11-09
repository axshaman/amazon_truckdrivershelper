
(function () {
  'use strict';

  const NAMESPACE = 'amazonRelayAssistant';
  const STORAGE_KEY = 'settings';
  const DEFAULT_SETTINGS = {
    refreshInterval: 5000,
    autoStart: false,
    skipStates: [],
    autoBook: false,
    autoBookCount: 1,
    audioAlerts: true,
    highlightNew: true
  };

  const DEFAULT_STATUS = {
    running: false,
    lastRefreshAt: null,
    nextRefreshAt: null,
    visibleLoads: 0,
    totalLoads: 0,
    skippedLoads: 0,
    autoBooked: 0,
    updatedAt: new Date().toISOString()
  };

  const MIN_REFRESH_INTERVAL = 500;
  const MAX_REFRESH_INTERVAL = 5 * 60 * 1000;
  const STATE_REGEX = /^[A-Z]{2}$/;

  function clampInterval(value) {
    if (!Number.isFinite(value)) {
      return DEFAULT_SETTINGS.refreshInterval;
    }
    return Math.min(Math.max(Math.round(value), MIN_REFRESH_INTERVAL), MAX_REFRESH_INTERVAL);
  }

  function normaliseStates(states) {
    if (Array.isArray(states)) {
      return Array.from(new Set(states.map((item) => (item || '').toString().trim().toUpperCase()).filter((item) => STATE_REGEX.test(item)))).sort();
    }
    if (typeof states === 'string') {
      return normaliseStates(states.split(/[\s,;]+/));
    }
    return [];
  }

  function formatClock(value) {
    if (!value) {
      return '—';
    }
    try {
      return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (error) {
      return '—';
    }
  }

  function formatDuration(ms) {
    if (!ms || ms <= 0) {
      return '—';
    }
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  function ready(callback) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    }
  }

  class BackgroundClient {
    async request(type, payload = {}) {
      if (!window.chrome || !chrome.runtime || !chrome.runtime.id) {
        return null;
      }
      return new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({ namespace: NAMESPACE, type, payload }, (response) => {
            const lastError = chrome.runtime.lastError;
            if (lastError) {
              reject(new Error(lastError.message));
              return;
            }
            resolve(response || null);
          });
        } catch (error) {
          reject(error);
        }
      });
    }

    async getSettings() {
      try {
        const response = await this.request('settings:get');
        if (response && response.ok) {
          return response.data;
        }
      } catch (error) {
        console.warn('[AmazonRelayAssistant] background settings request failed', error);
      }
      return this.fallbackGetSettings();
    }

    async saveSettings(settings) {
      try {
        const response = await this.request('settings:set', { settings });
        if (response && response.ok) {
          return response.data;
        }
      } catch (error) {
        console.warn('[AmazonRelayAssistant] background settings save failed', error);
      }
      await this.fallbackSaveSettings(settings);
      return settings;
    }

    async updateStatus(status) {
      try {
        await this.request('status:update', { status });
      } catch (error) {
        // no-op: status updates are optional telemetry
      }
    }

    fallbackGetSettings() {
      if (!chrome.storage || !chrome.storage.local) {
        return Promise.resolve({ ...DEFAULT_SETTINGS });
      }
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          resolve(result && result[STORAGE_KEY] ? result[STORAGE_KEY] : { ...DEFAULT_SETTINGS });
        });
      });
    }

    fallbackSaveSettings(settings) {
      if (!chrome.storage || !chrome.storage.local) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
          const lastError = chrome.runtime ? chrome.runtime.lastError : null;
          if (lastError) {
            reject(new Error(lastError.message));
            return;
          }
          resolve();
        });
      });
    }
  }

  class SettingsManager {
    constructor(client) {
      this.client = client;
      this.current = { ...DEFAULT_SETTINGS };
      this.loaded = false;
      this.listeners = new Set();
      this.registerListener();
    }

    registerListener() {
      if (chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area !== 'local' || !changes[STORAGE_KEY]) {
            return;
          }
          const value = changes[STORAGE_KEY].newValue;
          if (value) {
            this.apply(value, true, false);
          }
        });
      }
      if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
          if (!message || message.namespace !== NAMESPACE) {
            return;
          }
          if (message.type === 'settings:changed' && message.payload && message.payload.settings) {
            this.apply(message.payload.settings, true, false);
          }
        });
      }
    }

    async load() {
      if (this.loaded) {
        return this.current;
      }
      const settings = await this.client.getSettings();
      this.apply(settings, true, true);
      this.loaded = true;
      return this.current;
    }

    apply(settings, notify, mergeWithCurrent) {
      const base = mergeWithCurrent ? this.current : DEFAULT_SETTINGS;
      const merged = {
        ...base,
        ...(settings || {})
      };
      merged.refreshInterval = clampInterval(Number(merged.refreshInterval));
      merged.skipStates = normaliseStates(merged.skipStates);
      merged.autoBookCount = Math.max(1, Math.round(Number(merged.autoBookCount) || DEFAULT_SETTINGS.autoBookCount));
      merged.autoBook = Boolean(merged.autoBook);
      merged.autoStart = Boolean(merged.autoStart);
      merged.audioAlerts = Boolean(merged.audioAlerts);
      merged.highlightNew = Boolean(merged.highlightNew);
      this.current = merged;
      if (notify) {
        this.notify();
      }
      return this.current;
    }

    async save(partial) {
      const next = this.apply({ ...this.current, ...(partial || {}) }, false, false);
      await this.client.saveSettings(next);
      this.notify();
      return this.current;
    }

    notify() {
      this.listeners.forEach((listener) => {
        try {
          listener(this.current);
        } catch (error) {
          console.error('[AmazonRelayAssistant] settings listener failed', error);
        }
      });
    }

    subscribe(listener) {
      if (typeof listener !== 'function') {
        return () => {};
      }
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
  }

  class AssistantUI {
    constructor(callbacks) {
      this.callbacks = callbacks;
      this.elements = {};
      this.savedTimeout = null;
      this.mount();
    }

    mount() {
      if (this.elements.panel) {
        return;
      }
      this.injectStyles();
      const panel = document.createElement('section');
      panel.className = 'atra-panel';
      panel.innerHTML = `
        <header class="atra-header">
          <h2 class="atra-title">Amazon Relay Assistant</h2>
          <button class="atra-button atra-button--primary" data-role="toggle">Start</button>
        </header>
        <div class="atra-body">
          <div class="atra-row">
            <label class="atra-label" for="atra-refresh">Refresh interval (ms)</label>
            <input class="atra-input" type="number" min="${MIN_REFRESH_INTERVAL}" max="${MAX_REFRESH_INTERVAL}" data-role="refresh" id="atra-refresh" />
          </div>
          <div class="atra-row">
            <label class="atra-label" for="atra-skip">Skip states (comma separated)</label>
            <input class="atra-input" type="text" data-role="skip" id="atra-skip" placeholder="e.g. CA, NV" />
          </div>
          <div class="atra-row atra-row--split">
            <label class="atra-checkbox">
              <input type="checkbox" data-role="auto-book" />
              <span>Auto book matching loads</span>
            </label>
            <input class="atra-input atra-input--small" type="number" min="1" data-role="auto-book-count" />
          </div>
          <div class="atra-row atra-row--split">
            <label class="atra-checkbox">
              <input type="checkbox" data-role="audio" />
              <span>Play audio alerts</span>
            </label>
            <label class="atra-checkbox">
              <input type="checkbox" data-role="highlight" />
              <span>Highlight new loads</span>
            </label>
          </div>
          <div class="atra-row atra-row--split">
            <label class="atra-checkbox">
              <input type="checkbox" data-role="auto-start" />
              <span>Start automatically</span>
            </label>
            <button class="atra-button" data-role="refresh-now" type="button">Refresh now</button>
          </div>
          <div class="atra-status">
            <div class="atra-status-row">Status: <span data-role="status-text">Idle</span></div>
            <div class="atra-status-row">Last refresh: <span data-role="last">—</span></div>
            <div class="atra-status-row">Next refresh: <span data-role="next">—</span> <span class="atra-countdown" data-role="countdown"></span></div>
            <div class="atra-status-row">Visible loads: <span data-role="visible">0</span> / <span data-role="total">0</span></div>
            <div class="atra-status-row">Skipped: <span data-role="skipped">0</span></div>
            <div class="atra-status-row" data-role="book-row">Auto booked: <span data-role="booked">0</span></div>
            <div class="atra-status-row atra-status-row--saved" hidden data-role="saved">Settings saved</div>
            <div class="atra-status-row atra-status-row--error" hidden data-role="error"></div>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
      const q = (role) => panel.querySelector(`[data-role="${role}"]`);
      this.elements = {
        panel,
        toggle: q('toggle'),
        refresh: q('refresh'),
        skip: q('skip'),
        autoBook: q('auto-book'),
        autoBookCount: q('auto-book-count'),
        audio: q('audio'),
        highlight: q('highlight'),
        autoStart: q('auto-start'),
        refreshNow: q('refresh-now'),
        statusText: q('status-text'),
        last: q('last'),
        next: q('next'),
        countdown: q('countdown'),
        visible: q('visible'),
        total: q('total'),
        skipped: q('skipped'),
        booked: q('booked'),
        bookRow: q('book-row'),
        saved: q('saved'),
        error: q('error')
      };
      this.bindEvents();
    }

    injectStyles() {
      if (document.getElementById('atra-styles')) {
        return;
      }
      const style = document.createElement('style');
      style.id = 'atra-styles';
      style.textContent = `
        .atra-panel { position: fixed; bottom: 24px; right: 24px; width: 320px; max-width: calc(100% - 32px); z-index: 2147483646; background: #0f172a; color: #e2e8f0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.45); border-radius: 16px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.35); }
        .atra-panel * { box-sizing: border-box; }
        .atra-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: linear-gradient(135deg, #1e3a8a, #0f172a); }
        .atra-title { margin: 0; font-size: 16px; font-weight: 600; }
        .atra-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .atra-row { display: flex; flex-direction: column; gap: 8px; }
        .atra-row--split { flex-direction: row; justify-content: space-between; align-items: center; }
        .atra-label { font-size: 13px; font-weight: 500; }
        .atra-input { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(148, 163, 184, 0.25); background: rgba(15, 23, 42, 0.85); color: #e2e8f0; font-size: 13px; }
        .atra-input:focus { outline: 2px solid rgba(59, 130, 246, 0.45); outline-offset: 1px; }
        .atra-input--small { width: 96px; }
        .atra-button { border: none; border-radius: 9999px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; background: rgba(148, 163, 184, 0.16); color: #e2e8f0; transition: background 0.2s ease, transform 0.15s ease; }
        .atra-button:hover { background: rgba(148, 163, 184, 0.28); }
        .atra-button:active { transform: scale(0.98); }
        .atra-button--primary { background: #22c55e; color: #0f172a; }
        .atra-button--primary[data-state="running"] { background: #ef4444; color: #fff; }
        .atra-checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .atra-checkbox input[type="checkbox"] { width: 16px; height: 16px; accent-color: #3b82f6; }
        .atra-status { border-top: 1px solid rgba(148, 163, 184, 0.2); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
        .atra-status-row { display: flex; justify-content: space-between; gap: 12px; }
        .atra-status-row--error { color: #fecaca; }
        .atra-status-row--saved { color: #a7f3d0; }
        .atra-countdown { color: #38bdf8; font-weight: 600; }
        [data-atra-skip="true"] { opacity: 0.35 !important; filter: grayscale(0.6); }
        [data-atra-match="true"] { outline: 2px solid rgba(56, 189, 248, 0.55); outline-offset: -4px; }
        [data-atra-new="true"] { animation: atraPulse 1.2s ease-in-out 2; }
        @keyframes atraPulse { 0% { box-shadow: 0 0 0 rgba(56, 189, 248, 0.0); } 50% { box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.35); } 100% { box-shadow: 0 0 0 rgba(56, 189, 248, 0.0); } }
      `;
      document.head.appendChild(style);
    }

    bindEvents() {
      const { toggle, refreshNow, refresh, skip, autoBook, autoBookCount, audio, highlight, autoStart } = this.elements;
      toggle.addEventListener('click', () => {
        if (this.callbacks.onToggle) {
          this.callbacks.onToggle();
        }
      });
      refreshNow.addEventListener('click', () => {
        if (this.callbacks.onRefresh) {
          this.callbacks.onRefresh();
        }
      });
      refresh.addEventListener('change', () => {
        const value = clampInterval(Number(refresh.value));
        refresh.value = value;
        this.emit({ refreshInterval: value });
      });
      skip.addEventListener('change', () => {
        this.emit({ skipStates: normaliseStates(skip.value) });
      });
      autoBook.addEventListener('change', () => {
        autoBookCount.disabled = !autoBook.checked;
        this.emit({ autoBook: autoBook.checked });
      });
      autoBookCount.addEventListener('change', () => {
        const value = Math.max(1, Math.round(Number(autoBookCount.value) || 1));
        autoBookCount.value = value;
        this.emit({ autoBookCount: value });
      });
      audio.addEventListener('change', () => this.emit({ audioAlerts: audio.checked }));
      highlight.addEventListener('change', () => this.emit({ highlightNew: highlight.checked }));
      autoStart.addEventListener('change', () => this.emit({ autoStart: autoStart.checked }));
    }

    emit(partial) {
      if (this.callbacks.onSettingsChange) {
        this.callbacks.onSettingsChange(partial);
        this.showSaved();
      }
    }

    updateSettings(settings) {
      const { refresh, skip, autoBook, autoBookCount, audio, highlight, autoStart, bookRow } = this.elements;
      refresh.value = settings.refreshInterval;
      skip.value = settings.skipStates.join(', ');
      autoBook.checked = settings.autoBook;
      autoBookCount.disabled = !settings.autoBook;
      autoBookCount.value = settings.autoBookCount;
      audio.checked = settings.audioAlerts;
      highlight.checked = settings.highlightNew;
      autoStart.checked = settings.autoStart;
      bookRow.hidden = !settings.autoBook;
    }

    setRunning(isRunning) {
      const { toggle, statusText } = this.elements;
      toggle.dataset.state = isRunning ? 'running' : 'idle';
      toggle.textContent = isRunning ? 'Stop' : 'Start';
      statusText.textContent = isRunning ? 'Running' : 'Idle';
    }

    updateStatus(status) {
      const { last, next, visible, total, skipped, booked, bookRow } = this.elements;
      if (typeof status.lastRefreshAt !== 'undefined') {
        last.textContent = formatClock(status.lastRefreshAt);
      }
      if (typeof status.nextRefreshAt !== 'undefined') {
        next.textContent = formatClock(status.nextRefreshAt);
      }
      if (typeof status.visibleLoads !== 'undefined') {
        visible.textContent = status.visibleLoads;
      }
      if (typeof status.totalLoads !== 'undefined') {
        total.textContent = status.totalLoads;
      }
      if (typeof status.skippedLoads !== 'undefined') {
        skipped.textContent = status.skippedLoads;
      }
      if (typeof status.autoBooked !== 'undefined') {
        bookRow.hidden = status.autoBooked === null;
        booked.textContent = status.autoBooked ?? 0;
      }
    }

    updateCountdown(ms) {
      const { countdown } = this.elements;
      if (!ms || ms <= 0) {
        countdown.textContent = '';
        return;
      }
      countdown.textContent = `(${formatDuration(ms)})`;
    }

    showError(message) {
      const { error } = this.elements;
      error.textContent = message;
      error.hidden = !message;
    }

    clearError() {
      this.showError('');
    }

    showSaved() {
      const { saved } = this.elements;
      saved.hidden = false;
      if (this.savedTimeout) {
        clearTimeout(this.savedTimeout);
      }
      this.savedTimeout = setTimeout(() => {
        saved.hidden = true;
      }, 1500);
    }
  }

  class LoadBoardController {
    constructor(client, ui, settings) {
      this.client = client;
      this.ui = ui;
      this.settings = { ...settings };
      this.board = null;
      this.isRunning = false;
      this.refreshTimer = null;
      this.countdownTimer = null;
      this.observer = null;
      this.handleQueued = false;
      this.seen = new Set();
      this.booked = new Set();
      this.totalBooked = 0;
      this.audioContext = null;
      this.lastRefreshAt = null;
      this.lastAlertAt = 0;
      this.nextRefreshAt = null;
    }

    async init() {
      const board = await this.ensureBoard();
      if (!board) {
        this.ui.showError('Waiting for the Amazon Relay load board to become available…');
        return;
      }
      this.board = board;
      this.observeBoard();
      this.ui.clearError();
    }

    async ensureBoard() {
      const existing = document.querySelector('.available-work');
      if (existing) {
        return existing;
      }
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 15000);
        const observer = new MutationObserver(() => {
          const element = document.querySelector('.available-work');
          if (element) {
            clearTimeout(timeout);
            observer.disconnect();
            resolve(element);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }

    observeBoard() {
      if (!this.board || this.observer) {
        return;
      }
      this.observer = new MutationObserver(() => {
        if (!this.handleQueued) {
          this.handleQueued = true;
          requestAnimationFrame(() => {
            this.handleQueued = false;
            this.process();
          });
        }
      });
      this.observer.observe(this.board, { childList: true, subtree: true });
      this.process();
    }

    async start() {
      if (this.isRunning) {
        return true;
      }
      const board = await this.ensureBoard();
      if (!board) {
        this.ui.showError('Unable to find the load board on this page. Navigate to the Amazon Relay load board and try again.');
        return false;
      }
      this.board = board;
      this.ui.clearError();
      this.isRunning = true;
      this.booked.clear();
      this.totalBooked = 0;
      this.schedule(true);
      this.ui.setRunning(true);
      this.client.updateStatus({ ...DEFAULT_STATUS, running: true });
      return true;
    }

    stop() {
      if (!this.isRunning) {
        return;
      }
      this.isRunning = false;
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      this.nextRefreshAt = null;
      this.ui.setRunning(false);
      this.ui.updateCountdown(0);
      this.client.updateStatus({ ...DEFAULT_STATUS, running: false, lastRefreshAt: this.lastRefreshAt });
    }

    schedule(immediate) {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
      }
      if (immediate) {
        this.triggerRefresh(true);
      } else {
        this.nextRefreshAt = Date.now() + this.settings.refreshInterval;
        this.updateCountdown();
      }
      this.refreshTimer = setInterval(() => this.triggerRefresh(false), this.settings.refreshInterval);
      this.countdownTimer = setInterval(() => this.updateCountdown(), 500);
    }

    triggerRefresh(manual) {
      const button = this.findRefreshButton();
      if (!button) {
        this.ui.showError('Refresh control not found on the page.');
        return;
      }
      button.click();
      this.ui.clearError();
      this.booked.clear();
      this.lastRefreshAt = Date.now();
      this.nextRefreshAt = this.lastRefreshAt + this.settings.refreshInterval;
      this.ui.updateStatus({ lastRefreshAt: this.lastRefreshAt, nextRefreshAt: this.nextRefreshAt });
      this.updateCountdown();
      this.client.updateStatus({
        running: this.isRunning,
        lastRefreshAt: this.lastRefreshAt,
        nextRefreshAt: this.nextRefreshAt,
        visibleLoads: null,
        totalLoads: null,
        skippedLoads: null,
        autoBooked: this.totalBooked,
        updatedAt: new Date().toISOString(),
        manual
      });
    }

    manualRefresh() {
      this.triggerRefresh(true);
    }

    findRefreshButton() {
      const summary = document.getElementById('filter-summary__result-summary');
      if (summary && summary.parentElement) {
        const button = summary.parentElement.querySelector('button');
        if (button) {
          return button;
        }
      }
      return document.querySelector('button[data-testid*="refresh"], button[aria-label*="Refresh" i]');
    }

    process() {
      if (!this.board) {
        return;
      }
      const cards = this.collectCards();
      if (!cards.length) {
        this.ui.updateStatus({ totalLoads: 0, visibleLoads: 0, skippedLoads: 0, autoBooked: this.totalBooked });
        return;
      }
      const skipSet = new Set(this.settings.skipStates);
      let visible = 0;
      let skipped = 0;
      let newVisible = 0;
      const actionable = [];
      cards.forEach((card) => {
        const identifier = this.cardId(card);
        const text = (card.textContent || '').toUpperCase();
        const shouldSkip = skipSet.size > 0 && Array.from(skipSet).some((state) => this.matchesState(text, state));
        if (shouldSkip) {
          card.setAttribute('data-atra-skip', 'true');
          card.removeAttribute('data-atra-match');
          skipped += 1;
        } else {
          card.removeAttribute('data-atra-skip');
          card.setAttribute('data-atra-match', 'true');
          visible += 1;
          actionable.push({ card, identifier });
        }
        const isNewCard = !this.seen.has(identifier);
        if (isNewCard) {
          this.seen.add(identifier);
          if (this.settings.highlightNew) {
            card.setAttribute('data-atra-new', 'true');
            setTimeout(() => card.removeAttribute('data-atra-new'), 3500);
          }
          if (!shouldSkip) {
            newVisible += 1;
          }
        }
      });
      if (this.settings.audioAlerts && newVisible > 0) {
        this.playNotification();
      }
      this.handleAutoBook(actionable);
      this.ui.updateStatus({
        totalLoads: cards.length,
        visibleLoads: visible,
        skippedLoads: skipped,
        autoBooked: this.settings.autoBook ? this.totalBooked : null
      });
      this.client.updateStatus({
        running: this.isRunning,
        lastRefreshAt: this.lastRefreshAt,
        nextRefreshAt: this.nextRefreshAt,
        totalLoads: cards.length,
        visibleLoads: visible,
        skippedLoads: skipped,
        autoBooked: this.settings.autoBook ? this.totalBooked : null,
        updatedAt: new Date().toISOString()
      });
    }

    collectCards() {
      const selectors = [
        '[data-testid="work-opportunity-card"]',
        '[data-testid="load"]',
        '.wo-card',
        'article[data-testid*="card"]'
      ];
      const results = [];
      const seen = new Set();
      selectors.forEach((selector) => {
        this.board.querySelectorAll(selector).forEach((element) => {
          if (!seen.has(element)) {
            seen.add(element);
            results.push(element);
          }
        });
      });
      if (!results.length) {
        this.board.querySelectorAll('.available-work li, .available-work article').forEach((element) => {
          if (!seen.has(element)) {
            seen.add(element);
            results.push(element);
          }
        });
      }
      return results;
    }

    matchesState(text, state) {
      if (!text || !state) {
        return false;
      }
      const pattern = new RegExp(`\b${state}\b`, 'i');
      return pattern.test(text);
    }

    cardId(card) {
      return card.getAttribute('data-testid') || card.getAttribute('data-work-id') || card.id || (card.textContent || '').trim().slice(0, 80);
    }

    handleAutoBook(cards) {
      if (!this.settings.autoBook || !cards.length) {
        return;
      }
      let bookedNow = 0;
      for (const { card, identifier } of cards) {
        if (bookedNow >= this.settings.autoBookCount) {
          break;
        }
        if (this.booked.has(identifier)) {
          continue;
        }
        const button = this.findBookButton(card);
        if (!button) {
          continue;
        }
        button.click();
        this.booked.add(identifier);
        bookedNow += 1;
      }
      if (bookedNow > 0) {
        this.totalBooked += bookedNow;
        this.ui.updateStatus({ autoBooked: this.totalBooked });
      }
    }

    findBookButton(card) {
      const buttons = card.querySelectorAll('button');
      for (const button of buttons) {
        const text = (button.textContent || '').trim().toLowerCase();
        if (text.includes('book')) {
          return button;
        }
      }
      return null;
    }

    updateCountdown() {
      if (!this.isRunning || !this.nextRefreshAt) {
        this.ui.updateCountdown(0);
        return;
      }
      const remaining = this.nextRefreshAt - Date.now();
      this.ui.updateCountdown(remaining > 0 ? remaining : 0);
    }

    updateSettings(settings) {
      const previousInterval = this.settings.refreshInterval;
      this.settings = { ...settings };
      if (this.isRunning && previousInterval !== this.settings.refreshInterval) {
        this.schedule(false);
      }
    }

    playNotification() {
      if (!this.settings.audioAlerts) {
        return;
      }
      const now = Date.now();
      if (now - this.lastAlertAt < 750) {
        return;
      }
      try {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) {
          return;
        }
        if (!this.audioContext) {
          this.audioContext = new Context();
        }
        const context = this.audioContext;
        if (context.state === 'suspended') {
          context.resume();
        }
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.value = 0.08;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.25);
        this.lastAlertAt = now;
      } catch (error) {
        // ignore audio failures
      }
    }
  }

  class AmazonRelayAssistant {
    constructor() {
      this.client = new BackgroundClient();
      this.settingsManager = new SettingsManager(this.client);
      this.ui = new AssistantUI({
        onToggle: () => this.toggle(),
        onRefresh: () => this.manualRefresh(),
        onSettingsChange: (partial) => this.updateSettings(partial)
      });
      this.controller = null;
    }

    async init() {
      const settings = await this.settingsManager.load();
      this.ui.updateSettings(settings);
      this.controller = new LoadBoardController(this.client, this.ui, settings);
      await this.controller.init();
      this.settingsManager.subscribe((updated) => {
        this.ui.updateSettings(updated);
        if (this.controller) {
          this.controller.updateSettings(updated);
        }
      });
      if (settings.autoStart && this.controller) {
        this.controller.start();
      }
    }

    async toggle() {
      if (!this.controller) {
        return;
      }
      if (this.controller.isRunning) {
        this.controller.stop();
      } else {
        const started = await this.controller.start();
        if (!started) {
          this.ui.setRunning(false);
        }
      }
    }

    manualRefresh() {
      if (this.controller) {
        this.controller.manualRefresh();
      }
    }

    async updateSettings(partial) {
      const updated = await this.settingsManager.save(partial);
      if (this.controller) {
        this.controller.updateSettings(updated);
      }
    }
  }

  if (window.top === window.self) {
    ready(() => {
      if (document.body) {
        new AmazonRelayAssistant().init();
      }
    });
  }
})();
