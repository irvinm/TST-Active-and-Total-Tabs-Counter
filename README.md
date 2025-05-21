![CI/CD](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/workflows/CI/CD/badge.svg) ![Mozilla Add-on](https://img.shields.io/amo/users/TST-Active-and-Total-Tabs-Ctr.svg?style=flat-square) ![](https://img.shields.io/amo/v/TST-Active-and-Total-Tabs-Ctr.svg?style=flat-square)

# TST Active and Total Tabs Counter
### This project is to help track and display:
- Active (non-discarded) tabs per window
- Total active tabs across all windows
- Total tabs per window
- Total tabs across all windows

### To enable this extension to work within Private Windows
- Enable the extension itself to "Allow" to "Run in Private Windows"
    - about:addons -> TST Active and Total Tabs Counter -> Allow "Run in Private Windows"
- Enable the extension to interact with TST in Private Windows
    - TST Options -> Extra Features via Other Extensions -> Enable "Notify Message from Private Windows" for "TST Active and Total Tabs Counter" -> Restart TST or the browser

# New features
- v0.9.9: Added new display option for a more compact list of information
  - Click on the addon badge and either select the original "1 line per window" option or the new "compact view" option to be shown in TST
  - The compact view will be left justified, narrow font, self-adjusting button height, window info text will not wrap, and will dynamically adjust if the sidebar is resized or the number of tabs or windows change
  - ![Compact Example](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/blob/main/images/CompactView.png)
- v0.9.8: Clicking on the badge icon will allow the user to choose the badge rendering method they want to use.
  - Option 1:  Native tab counter up to 999 tabs ![Native up to 999 tabs](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/blob/main/images/BadgeText-999-Cropped.png), SVG with more than 1000 tabs ![SVG with 1000](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/blob/main/images/SVG-1000-Cropped.png)
  - Option 2:  SVG rendering up to 999 tabs ![SVG with 999](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/blob/main/images/SVG-999-Cropped.png), SVG with more than 1000 tabs ![SVG with 1000](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/blob/main/images/SVG-1000-Cropped.png)

# History of the problem
Older versions of TST could accomplish this with some counting CSS code.  However, as of TST v4.0 [(Github Release)](https://github.com/piroor/treestyletab/releases/tag/4.0.1), TST introduces some performance improvements that effectively breaks the CSS counting solution. [(TST Discussion)](https://github.com/piroor/treestyletab/discussions/3472)

This addon tracks the number of active tabs and total tabs to be displayed on top of the "newtab button" inside the TST sidebar.  
- If there is only 1 window, there will only be one line with (active tabs) / (total tabs).
- If there are multiple windows, each window's information is shown on a separate line followed by the totals.

Addon icon provided by:   <a href="https://www.flaticon.com/free-icons/school-material" title="school-material icons">School-material icons created by Freepik - Flaticon</a>

# Examples (1 line per window vs. Compact mode)
## 1 line per window
### 1 Window (Total only - 4 Active, 108 Total)
![1Window](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/d13c8d87-d1e2-4474-aef9-74cc680fbedb)

### 2 Windows (Individual windows (4A/108T, 1A/1T), then Total (5A/109T))
![2Windows](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/438dfdac-6468-495a-907f-b3cf75973108)

### 3 Windows (Individual windows (4A/108T, 1A/1T, 3A/3T), then Total (8A/112T))
![3Windows](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/901d2e6d-8a16-48d1-b3be-6ba595111b9a)

## Compact mode (v0.9.9+)
### 1 line per window
![image](https://github.com/user-attachments/assets/4f256b5c-5c2c-42ac-ac69-5c75a31a6870)
### Compact mode
![image](https://github.com/user-attachments/assets/aadc049d-012d-4ff0-85dd-b0f36bb572d3)
