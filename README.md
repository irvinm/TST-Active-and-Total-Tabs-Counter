![CI/CD](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/workflows/CI/CD/badge.svg) ![Mozilla Add-on](https://img.shields.io/amo/users/TST-Active-and-Total-Tabs-Counter.svg?style=flat-square) ![](https://img.shields.io/amo/v/TST-Active-and-Total-Tabs-Counter.svg?style=flat-square)

# TST Active and Total Tabs
This project is to help track and display:
- Active (non-discarded) tabs per window
- Total active tabs across all windows
- Total tabs per window
- Total tabs across all windows

Older versions of TST could accomplish this with some counting CSS code.  However, as of TST v4.0 [(Github Release)](https://github.com/piroor/treestyletab/releases/tag/4.0.1), TST introduces some performance improvements that effectively breaks the CSS counting solution. [(TST Discussion)](https://github.com/piroor/treestyletab/discussions/3472)

This addon tracks the number of active tabs and total tabs to be displayed on top of the "newtab button" inside the TST sidebar.  
- If there is only 1 window, there will only be one line with (active tabs) / (total tabs).
- If there are multiple windows, each window's information is shown on a separate line followed by the totals.

Addon icon provided by:   <a href="https://www.flaticon.com/free-icons/school-material" title="school-material icons">School-material icons created by Freepik - Flaticon</a>

# 1 Window (Total only - 4 Active, 108 Total)
![1Window](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/d13c8d87-d1e2-4474-aef9-74cc680fbedb)

# 2 Windows (Individual windows (4A/108T, 1A/1T), then Total (5A/109T))
![2Windows](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/438dfdac-6468-495a-907f-b3cf75973108)

# 3 Windows (Individual windows (4A/108T, 1A/1T, 3A/3T), then Total (8A/112T))
![3Windows](https://github.com/irvinm/TST-Active-and-Total-Tabs-Counter/assets/979729/901d2e6d-8a16-48d1-b3be-6ba595111b9a)
