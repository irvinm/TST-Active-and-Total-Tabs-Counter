# AMO Listing Documentation (addons.mozilla.org)

This document contains the listing copy for **TST Active and Total Tabs Counter** on [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/tst-active-and-total-tabs-ctr/). Use this content when updating the add-on listing metadata.

---

## Short Description / Summary
*(AMO limit: 250 characters, plain text only)*

Displays active and total tab counts in Tree Style Tab and on the toolbar badge. Supports custom window naming, 1-line or compact layouts, per-window or total badge counts, and standalone mode without TST. Click the toolbar badge for settings.

---

## Full Description
*(AMO Markdown format - strictly conforms to https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/#make-use-of-markdown)*

**TST Active and Total Tabs Counter** tracks loaded (non-discarded) and total tabs across all your open windows, displaying real-time tab statistics directly in the **Tree Style Tab** (TST) sidebar and on the browser toolbar button.

Originally created to restore the active tab counting functionality lost after TST 4.0, this extension has evolved into a full-featured tab counter with custom window naming, flexible display scopes, and high-capacity toolbar badge rendering.

⚙️ Click on the addon toolbar button at any time to configure options in the tabbed settings interface.

**🏷️ Custom Window Naming**

Give meaningful names to your Firefox windows (such as *Work*, *Research*, or *Social*) directly from the popup:

* **Persistent Names**: Window names persist across browser sessions and restarts.
* **Seamless TST Integration**: Custom names replace generic `Win 1` / `W1` labels across both 1-line and compact sidebar layouts.
* **Auto-Save**: Changes take effect and update Tree Style Tab in real time as you type.

**📊 Tree Style Tab Sidebar Display Styles**

Choose between two sidebar layouts to fit your workspace:

* **1 Line Per Window (Monospace Table)**: Displays one row per window with aligned columns. The asterisk `*` marks the currently active window.
```
*Work:      12 / 145 tabs
 Research:   8 / 210 tabs
 Social:     4 /  22 tabs
 Total:     24 / 377 tabs
```
* **Compact View (Continuous Flow)**: Minimizes vertical space by grouping window statistics inline. Example: `*Work: 12/145, Research: 8/210, Social: 4/22, T: 24/377`
* **Sidebar Scope**: Choose whether the sidebar counter shows tab counts for **All Windows** or strictly the **Current Window**.

**🔢 Toolbar Badge Counter**

Keep track of your tabs even when the sidebar is collapsed or when using Firefox without Tree Style Tab:

* **Badge Scope**: Configure the toolbar badge to show the tab count for the **Current Window Only** or the **Total Across All Windows**.
* **Automatic Focus Tracking**: In Current Window mode, the badge dynamically updates as you switch between windows.
* **Dynamic SVG Rendering (Up to 9,999 Tabs)**: Firefox native badges truncate at 3 characters. This extension features dynamic SVG badge rendering that cleanly displays 4 digits (up to 9,999 tabs) without clipping. Choose between **Hybrid Mode** (Native 1–999, SVG 1000+) or **Always SVG Mode**.
* **Standalone Support**: Works independently as a toolbar tab counter even if Tree Style Tab is disabled or not installed.

**🔒 Using with Private Windows**

To allow tab counts to reflect private browsing windows:

1. **Allow in Private Windows**: Go to `about:addons` ➔ **TST Active and Total Tabs Counter** ➔ toggle **Run in Private Windows** to **Allow**.
2. **Enable TST Private Window Messaging**: Go to **Tree Style Tab Options** ➔ **Extra Features via Other Extensions** ➔ check **Notify Message from Private Windows for TST Active and Total Tabs Counter** ➔ restart TST or Firefox.

**🔗 Feedback & Support**

* [GitHub Repository & Source Code](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter)
* [Report Issues & Request Features](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/issues)
