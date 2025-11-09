
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

let runtimeStatus = { ...DEFAULT_STATUS };

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

function ensureDefaults() {
  chrome.storage.local.get([STORAGE_KEY], (items) => {
    if (!items || !items[STORAGE_KEY]) {
      chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
    }
  });
}

function storageGet() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (items) => {
      resolve(items && items[STORAGE_KEY] ? items[STORAGE_KEY] : { ...DEFAULT_SETTINGS });
    });
  });
}

function storageSet(settings) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(settings);
    });
  });
}

function sanitiseSettings(settings) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...(settings || {})
  };
  merged.refreshInterval = clampInterval(Number(merged.refreshInterval));
  merged.skipStates = normaliseStates(merged.skipStates);
  merged.autoBookCount = Math.max(1, Math.round(Number(merged.autoBookCount) || DEFAULT_SETTINGS.autoBookCount));
  merged.autoBook = Boolean(merged.autoBook);
  merged.autoStart = Boolean(merged.autoStart);
  merged.audioAlerts = Boolean(merged.audioAlerts);
  merged.highlightNew = Boolean(merged.highlightNew);
  return merged;
}

function updateStatus(partial) {
  if (!partial) {
    return runtimeStatus;
  }
  runtimeStatus = {
    ...runtimeStatus,
    ...partial,
    updatedAt: new Date().toISOString()
  };
  return runtimeStatus;
}

async function handleMessage(message) {
  switch (message.type) {
    case 'settings:get': {
      const settings = await storageGet();
      return { ok: true, data: settings };
    }
    case 'settings:set': {
      const payloadSettings = message.payload ? message.payload.settings : null;
      const settings = sanitiseSettings(payloadSettings);
      await storageSet(settings);
      runtimeStatus = { ...DEFAULT_STATUS };
      chrome.runtime.sendMessage({ namespace: NAMESPACE, type: 'settings:changed', payload: { settings } });
      return { ok: true, data: settings };
    }
    case 'status:get': {
      return { ok: true, data: runtimeStatus };
    }
    case 'status:update': {
      const status = message.payload ? message.payload.status : null;
      return { ok: true, data: updateStatus(status) };
    }
    case 'settings:changed': {
      return { ok: true, data: runtimeStatus };
    }
    default:
      return { ok: false, error: 'Unknown message type' };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensureDefaults();
  runtimeStatus = { ...DEFAULT_STATUS };
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.namespace !== NAMESPACE) {
    return false;
  }
  handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    runtimeStatus = { ...DEFAULT_STATUS };
    chrome.runtime.sendMessage({ namespace: NAMESPACE, type: 'settings:changed', payload: { settings: sanitiseSettings(changes[STORAGE_KEY].newValue) } });
  }
});
