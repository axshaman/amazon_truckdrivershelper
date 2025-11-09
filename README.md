# Amazon Relay Assistant

Amazon Relay Assistant is a Chrome browser extension that streamlines load hunting on Amazon Relay. It injects a floating control panel directly into the load board so you can automate refreshes, filter out unwanted lanes, receive audible alerts for new matches and even auto-book a configurable number of loads.

## Features
- **Floating control panel** with start/stop controls, live telemetry and one-click manual refresh.
- **Configurable refresh cadence** (500 ms – 5 minutes) with countdown feedback.
- **Skip state filters** that dim unwanted loads without touching the underlying page markup.
- **Optional auto-booking** with configurable booking limits per cycle and visual markers for booked cards.
- **Audio and visual signalling** for newly discovered opportunities, plus the ability to disable either at any time.
- **Chrome storage synchronisation** so preferences persist across sessions and tabs.
- **Message-driven runtime API** (documented in [`docs/openapi.yaml`](docs/openapi.yaml)) for companion tooling and diagnostics.
- **Minimal permissions** – the extension now bundles all assets locally and only requires `storage` access.

## Installation
1. Install dependencies (optional, only required when building from source):
   ```bash
   npm install
   ```
2. Build the optional Vue assets (legacy popup) if desired:
   ```bash
   npm run build
   ```
   This step is not required to use the core assistant functionality.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the repository folder.

## Using the Assistant
1. Navigate to the Amazon Relay load board (`relay.amazon.com` or a supported regional domain).
2. The control panel appears in the bottom-right corner once the load board is detected.
3. Configure your preferences:
   - **Refresh interval** – milliseconds between automated refreshes.
   - **Skip states** – comma-separated list of two-letter state abbreviations.
   - **Auto book matching loads** – enable automatic booking and specify how many cards to attempt per cycle.
   - **Play audio alerts / Highlight new loads** – toggle notification styles.
   - **Start automatically** – auto-start when the load board becomes available.
4. Press **Start** to begin automated refreshes or **Refresh now** for a one-off update.

The status block tracks the most recent refresh time, next scheduled refresh, visible/total load counts, skipped load totals and auto-book progress.

## Development Workflow
- **Content script** lives in [`js/plugin_start.js`](js/plugin_start.js) and is responsible for UI rendering, DOM observation and automation.
- **Background script** (`js/background.js`) exposes a small message-based API and keeps settings in sync via `chrome.storage`.
- **Webpack Encore** continues to build the optional Vue assets under `assets/` (`npm run dev` / `npm run build`). These assets are not required for the new control panel but remain available for advanced UI customisation.

### Scripts
| Command | Description |
| ------- | ----------- |
| `npm run dev` | Builds assets once in development mode. |
| `npm run watch` | Rebuilds assets when files change. |
| `npm run dev-server` | Starts the Encore dev server (legacy Vue tooling). |
| `npm run build` | Produces production-ready bundles in `build/`. |

## Documentation
- **Runtime API** – [`docs/openapi.yaml`](docs/openapi.yaml) details the message contracts for retrieving and updating settings and runtime status.
- **Architecture** – [`docs/architecture.md`](docs/architecture.md) captures the C4 context, container, and component views of the extension.

## Roadmap Ideas
- Migrate to Manifest V3 with a service worker-based background script.
- Expand filtering to support lane-specific preferences and price thresholds.
- Surface historical telemetry in a popup or dashboard.

Contributions and feedback are welcome via pull requests or issues.
