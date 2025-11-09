# Amazon Relay Assistant – C4 Architecture Model

## Level 1 – System Context
The Amazon Relay Assistant browser extension augments the Amazon Relay load board experience for drivers and dispatchers. It operates entirely within the browser, reading the load board DOM, applying user-configurable rules, and optionally performing automated actions on behalf of the user.

```mermaid
C4Context
  title Amazon Relay Assistant – System Context
  Person(truckDriver, "Truck Driver / Dispatcher", "Configures automation rules and monitors load availability.")
  System(amazonRelay, "Amazon Relay", "Official web application for browsing and booking loads.")
  System_Boundary(extension, "Amazon Relay Assistant Extension") {
    Container(contentScript, "Content Script", "JavaScript", "Injects the control panel, refresh logic, filters and booking helpers.")
    Container(background, "Background Script", "JavaScript", "Maintains shared settings/state and exposes a messaging API.")
  }
  Rel(truckDriver, contentScript, "Configures automation and reviews status")
  Rel(contentScript, amazonRelay, "Reads and interacts with the load board DOM")
  Rel(contentScript, background, "chrome.runtime messages")
```

## Level 2 – Container Diagram
The extension consists of two runtime containers: the content script that lives inside each Amazon Relay tab and the lightweight background script that coordinates persistent storage and telemetry.

```mermaid
C4Container
  title Amazon Relay Assistant – Containers
  Person(truckDriver, "Truck Driver")
  System_Ext(amazonRelay, "Amazon Relay", "Hosted web application")

  Container_Boundary(extension, "Amazon Relay Assistant") {
    Container(contentScript, "Content Script", "ES2022", "Injects UI panel, MutationObservers and automation timers.")
    Container(background, "Background Script", "ES2022", "Owns storage, API layer and extension telemetry.")
    ContainerDb(storage, "Chrome Storage", "Key/Value Store", "Persists assistant settings across sessions.")
  }

  Rel(truckDriver, contentScript, "Uses")
  Rel(contentScript, amazonRelay, "Reads DOM, triggers refresh clicks")
  Rel(contentScript, background, "Namespace messages (settings/status)")
  Rel(background, storage, "Read/Write settings")
  Rel(contentScript, storage, "Observes change events")
```

## Level 3 – Component Diagram
Within the content script we divide responsibilities into clearly scoped components.

```mermaid
C4Component
  title Content Script Components
  Container(contentScript, "Content Script", "ES2022", "Amazon Relay page augmentation")

  Component(settingsManager, "SettingsManager", "Class", "Loads, normalises and persists configuration via background API.")
  Component(uiController, "AssistantUI", "Class", "Renders the floating control panel and handles user interactions.")
  Component(loadController, "LoadBoardController", "Class", "Observes the load board, applies filters, schedules refreshes and auto-booking.")
  Component(backgroundClient, "BackgroundClient", "Class", "Thin wrapper over chrome.runtime messaging.")

  Rel(settingsManager, backgroundClient, "settings:get / settings:set")
  Rel(loadController, backgroundClient, "status:update")
  Rel(uiController, settingsManager, "Pushes updates on user changes")
  Rel(settingsManager, loadController, "Publishes normalised settings")
```

The background script groups two responsibilities:

- **Settings Gateway** – sanitises incoming settings, persists them to `chrome.storage.local` and broadcasts changes.
- **Telemetry Aggregator** – collects lightweight runtime metrics (last refresh, skip counts, booking totals) for diagnostics and external tooling.

## Level 4 – Code/Implementation Notes
- **`js/plugin_start.js`** hosts the classes described above, initialises them when the DOM is ready and ensures the assistant only runs in the top-level frame.
- **`js/background.js`** exposes the message-based API (documented in [`docs/openapi.yaml`](./openapi.yaml)), keeps default settings in sync and fans out change notifications.
- **`manifest.json`** declares both containers, tightens extension permissions to the minimum (`storage`) and documents the Amazon Relay surfaces targeted by the content script.

### Data Flow Summary
1. The content script waits for the Amazon Relay load board, injects the control panel and optionally auto-starts using persisted settings.
2. User interactions update the `SettingsManager`, which normalises values, persists them through the background script and broadcasts updates to other tabs.
3. The `LoadBoardController` attaches a `MutationObserver` to the load board, filters cards based on skip states, triggers audio/visual cues for newly discovered loads and optionally clicks booking buttons.
4. Telemetry (counts, timestamps, booking totals) is merged into the background runtime status for future diagnostics or companion tooling.

### Deployment & Operational Considerations
- The extension no longer relies on remote script injection; all functionality ships with the packaged assets.
- Permissions are deliberately minimal to simplify review and support the Chrome extension MV2 to MV3 migration path.
- Settings are synchronised via both storage change listeners and runtime broadcasts to avoid stale configurations across multiple open tabs.
