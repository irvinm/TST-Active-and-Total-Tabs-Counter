![CI/CD](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/workflows/CI/CD/badge.svg) ![Mozilla Add-on](https://img.shields.io/amo/users/TST-Active-and-Total-Tabs-Ctr.svg?style=flat-square) ![](https://img.shields.io/amo/v/TST-Active-and-Total-Tabs-Ctr.svg?style=flat-square)

# TST Active and Total Tabs Counter
### This project is to help track and display:
- Active (non-discarded) tabs per window and across all windows
- Total tabs per window and across all windows
- Custom, persistent window names across the sidebar and popup settings
- Configurable sidebar and badge display scopes (All Windows or Current Window Only)
- Active window marker (`*`) in multi-window sidebar displays
- Choice between monospace table ("1 Line Per Window") and continuous inline ("Compact View") layouts

### To enable this extension to work within Private Windows
- Enable the extension itself to "Allow" to "Run in Private Windows"
    - about:addons -> TST Active and Total Tabs Counter -> Allow "Run in Private Windows"
- Enable the extension to interact with TST in Private Windows
    - TST Options -> Extra Features via Other Extensions -> Enable "Notify Message from Private Windows" for "TST Active and Total Tabs Counter" -> Restart TST or the browser

# History of the problem
Older versions of TST could accomplish this with some counting CSS code. However, as of TST v4.0 [(Github Release)](https://github.com/piroor/treestyletab/releases/tag/4.0.1), TST introduces some performance improvements that effectively breaks the CSS counting solution. [(TST Discussion)](https://github.com/piroor/treestyletab/discussions/3472)

This addon tracks the number of active tabs and total tabs to be displayed directly on top of the "new tab button" inside the Tree Style Tab sidebar, as well as on the browser toolbar badge.
- **Sidebar Scope**: Show tab counts across all windows (with the current window marked with `*`) or scoped strictly to the current window.
- **Display Layout**: Choose between the table-aligned "1 Line Per Window" format or the space-saving "Compact View".
- **Custom Window Names**: Assign persistent names to windows via the extension popup.

Addon icon provided by:   <a href="https://www.flaticon.com/free-icons/school-material" title="school-material icons">School-material icons created by Freepik - Flaticon</a>

# Examples
## 1 line per window
### 1 Window (Total only - 4 Active, 108 Total)
![1Window](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/d13c8d87-d1e2-4474-aef9-74cc680fbedb)

### 2 Windows (Individual windows (4A/108T, 1A/1T), then Total (5A/109T))
![2Windows](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/438dfdac-6468-495a-907f-b3cf75973108)

### 3 Windows (Individual windows (4A/108T, 1A/1T, 3A/3T), then Total (8A/112T))
![3Windows](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/901d2e6d-8a16-48d1-b3be-6ba595111b9a)

## Layout Comparison (v0.9.9+)
### 1 line per window
![image](https://github.com/user-attachments/assets/4f256b5c-5c2c-42ac-ac69-5c75a31a6870)
### Compact mode
![image](https://github.com/user-attachments/assets/aadc049d-012d-4ff0-85dd-b0f36bb572d3)

## Version History

<details open>
<summary><b>Version 1.1.0 (October 6, 2026) - Custom Window Names, Scope Controls, Tabbed Settings UI & Test Suite</b></summary>

- **Custom Window Naming**: Assign custom, persistent names to Firefox windows with inline popup editing; custom window names update in real time across the TST sidebar display and persist across browser restarts.
- **Tabbed Settings Popup UI**: Completely redesigned extension popup into an intuitive 3-tab layout (*Window Names*, *Sidebar Display*, and *Badge Counter*) with smooth transitions and compact styling.
- **Sidebar Display Scope**: Configure whether the TST sidebar counter displays tab counts across all open windows or strictly for the current window.
- **Current Window Indicator**: In multi-window "All Windows" mode, prepends an asterisk (`*`) to the current window's row in each sidebar to visually distinguish the active window.
- **Toolbar Badge Scope**: Choose whether the extension toolbar badge displays the total count across all windows or the count for the current window only.
- **Layout Preview**: Added a live text preview in the popup demonstrating the selected sidebar display format and scope.
- **Theme & Header Controls**: Added dark/light theme switching with saved preference, direct "Open in separate tab" shortcut button, and header actions matching TST Lock design.
- **Badge Synchronization & Standalone Mode**: Fixed badge count synchronization on browser startup, debounced tab closures/removals, and ensured reliable standalone operation when Tree Style Tab is disabled or inactive.
- **Unit Test Suite**: Added a comprehensive Jest test suite (123+ unit tests) covering background logic, popup interactions, and badge calculations with CI integration.
- **Manifest Permissions**: Added `sessions` and `tabs` permissions for window naming and synchronization.
- **Build & Lint Tooling**: Integrated `web-ext` build and lint pipeline (`npm run build`, `npm run lint`) matching TST Lock standards, updated Firefox ESR min-version baseline (115.0), resolved all DOM parser lint warnings, and modernized GitHub Actions CI/CD.

</details>

<details>
<summary><b>Version 0.9.10 (August 26, 2026) - TST 4.4.1+ Compatibility & AMO Compliance</b></summary>

- **TST 4.4.1+ Compatibility & Spacing**: Updated button layout and vertical alignment for Tree Style Tab 4.4.1+, including caret action selector button alignment and exact sidebar spacing matching TST standards.
- **Manifest & AMO Compliance**: Declared Firefox `data_collection_permissions` in manifest.json for AMO compliance.

</details>

<details>
<summary><b>Version 0.9.9 (July 27, 2024) - Compact View Layout & Popup Styling</b></summary>

- **Compact View Layout**: Added a space-saving compact display option inside the Tree Style Tab sidebar featuring a narrow font, self-adjusting button height, non-wrapping window text, and dynamic adjustment on sidebar resize.
- **Display Style Option**: Added popup selection allowing users to choose between the classic "1 Line Per Window" monospace table and the new "Compact View" layout.
- **Popup Stylesheet**: Introduced `popup.css` for popup interface styling and asset packaging.

</details>

<details>
<summary><b>Version 0.9.8 (July 1, 2024) - Dynamic SVG Badge Rendering & Security Hardening</b></summary>

- **Dynamic SVG Badge**: Added dynamic SVG rendering for toolbar badge counts to cleanly display counts of 1,000+ tabs beyond native badge 3-character limitations.
- **Badge Render Modes**: Allowed choosing between Native (1–999) + SVG (1000+) or Always SVG rendering.
- **Security Hardening**: Replaced `innerHTML` usage with safe DOM manipulation to address AMO security warnings.
- **Build Pipeline**: Included popup assets into the extension packaging build scripts.

</details>

<details>
<summary><b>Version 0.9.7 (June 23, 2024) - Diagnostic Logging & Link Fixes</b></summary>

- **Logging & Timing**: Added structured diagnostic logging and adjusted retry sleep schedule.
- **Documentation**: Fixed counter badge image URLs in README.md.

</details>

<details>
<summary><b>Version 0.9.6 (June 23, 2024) - Async Optimization</b></summary>

- **Async Timing**: Added `await` to asynchronous sleep calls and removed redundant `updateTabCount()` invocations.

</details>

<details>
<summary><b>Version 0.9.5 (June 23, 2024) - Extended Startup Retries</b></summary>

- **Startup Resiliency**: Extended startup retry attempts up to 15 seconds to ensure reliable connection with Tree Style Tab during delayed browser starts.

</details>

<details>
<summary><b>Version 0.9.4 (June 23, 2024) - Initial State Synchronization</b></summary>

- **State Timing**: Added delayed calls to ensure initial tab state is properly loaded into TST.

</details>

<details>
<summary><b>Version 0.9.3 (June 23, 2024) - Secondary Registration Fallback</b></summary>

- **Registration Fallback**: Added a 3-second delayed secondary registration call to resolve intermittent startup communication issues.

</details>

<details>
<summary><b>Version 0.9.2 (June 23, 2024) - Registration Retry Logic</b></summary>

- **Connection Resiliency**: Added retry logic if initial registration with Tree Style Tab fails.

</details>

<details>
<summary><b>Version 0.9.1 (June 23, 2024) - Registration Identifier</b></summary>

- **Registration Metadata**: Updated extension registration name used during TST communication.

</details>

<details>
<summary><b>Version 0.9.0 (June 22, 2024) - Initial Release</b></summary>

- **Core Functionality**: Injected active and total tab counter display into the Tree Style Tab sidebar above the new-tab button.
- **Multi-Window Counting**: Tracked active (non-discarded) and total tabs per window and across all open windows.
- **Toolbar Badge**: Added dynamic badge counter to the extension toolbar button displaying total tabs.
- **Build & CI Automation**: Established automated XPI build scripts and GitHub Actions CI/CD pipeline.

</details>

