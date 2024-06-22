const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// Register the addon with TST
const registerToTST = async () => {
  try {
    const windows = await browser.windows.getAll();
    const height = 1.5 + windows.length; // Calculate new height
    // Base CSS to include with updates
    const baseCSS = `
      .newtab-button::after {
        display: none;
      }
      .newtab-button .extra-items-container {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `;
    // New CSS for updating the height of .newtab-button
    const heightCSS = `.newtab-button { height: ${height}rem !important; }`;
    // Combine the base CSS with the new height CSS
    const combinedCSS = baseCSS + heightCSS;

    // Send a synchronus message to TST to register the addon and adjust the new tab button height
    await browser.runtime.sendMessage('treestyletab@piro.sakura.ne.jp', {
      type: 'register-self',
      name: 'Your Addon Name',
      style: combinedCSS,
      listeningTypes: ['ready', 'tabbar-updated', 'sidebar-show']
    });

  } catch (e) {
    console.error('Failed to communicate with TST', e);
  }

  await sleep(500);

  // Update the tab count CSS after registering with TST
  updateTabCount();
};

const updateTabCount = async () => {
  try {
    // Get all tabs globally
    const allTabs = await browser.tabs.query({});
    const loadedTabsGlobal = allTabs.filter(tab => !tab.discarded).length;
    const totalTabsGlobal = allTabs.length;

    // Get all windows
    const windows = await browser.windows.getAll();
    let contents = '';

    // Iterate through each window to get tabs info
    for (const window of windows) {
      const tabsThisWindow = await browser.tabs.query({ windowId: window.id });
      const loadedTabsThisWindow = tabsThisWindow.filter(tab => !tab.discarded).length;
      const totalTabsThisWindow = tabsThisWindow.length;

      // Generate HTML content for this window
      contents += `<div style="font-family: monospace; display: table;">
                      <div style="display: table-row;">
                          <span style="display: table-cell; text-align: right;width: 80px;">Window ${window.id}:</span>
                          <span style="display: table-cell; text-align: right; padding-left: 5px; width: 25px;" id="loadedTabsThisWindow-${window.id}">${loadedTabsThisWindow}</span>
                          <span style="display: table-cell; padding-left: 2px;">/</span>
                          <span style="display: table-cell; text-align: left; padding-left: 2px; width: 25px;" id="totalTabsThisWindow-${window.id}">${totalTabsThisWindow}</span>
                          <span style="display: table-cell; padding-left: 5px;">tabs</span>
                      </div>
                   </div>`;
    }

    // Add global tabs info
    contents += `<div style="font-family: monospace; display: table;">
                    <div style="display: table-row;">
                        <span style="display: table-cell; text-align: right;width: 80px;">Total:</span>
                        <span style="display: table-cell; text-align: right; padding-left: 5px; width: 25px;">${loadedTabsGlobal}</span>
                        <span style="display: table-cell; padding-left: 2px;">/</span>
                        <span style="display: table-cell; text-align: left; padding-left: 2px; width: 25px;">${totalTabsGlobal}</span>
                        <span style="display: table-cell; padding-left: 5px;">tabs</span>
                    </div>
                 </div>`;

    // Update the TST new tab button with the generated content
    await browser.runtime.sendMessage('treestyletab@piro.sakura.ne.jp', {
      type: 'set-extra-contents',
      place: 'new-tab-button',
      contents: contents,
    });

  } catch (e) {
    console.error('Failed to update tab count', e);
  }
};

// Listen for TST events
browser.runtime.onMessageExternal.addListener((message, sender) => {
  if (sender.id !== 'treestyletab@piro.sakura.ne.jp') return;

  console.log('Message from TST:', message);

  switch (message.type) {
    case 'ready':
    case 'tabbar-updated':
    case 'sidebar-show':
      updateTabCount();
      break;
  }
});

// Listen for tab events
browser.tabs.onCreated.addListener(updateTabCount);
browser.tabs.onRemoved.addListener(updateTabCount);
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if ('discarded' in changeInfo) {
    updateTabCount();
  }
});

// Listen for window events and update newtab button height as needed
browser.windows.onCreated.addListener(registerToTST);
browser.windows.onRemoved.addListener(registerToTST);

// Register to TST and update tab count on startup
registerToTST();
updateTabCount();