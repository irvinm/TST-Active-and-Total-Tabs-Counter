document.addEventListener('DOMContentLoaded', async function() {
    const options = {
        switchToSVG: ['./images/BadgeText-9-Cropped.png', './images/BadgeText-99-Cropped.png', './images/BadgeText-999-Cropped.png', './images/SVG-1000-Cropped.png'],
        alwaysSVG: ['./images/SVG-9-Cropped.png', './images/SVG-99-Cropped.png', './images/SVG-999-Cropped.png', './images/SVG-1000-Cropped.png'],
        oneLinePerWindow: ['./images/OneLinePerWindow.png'],
        compactView: ['./images/CompactView.png']
    };

    function updateImageRow(selectedOption) {
        const imageRow = document.querySelector('#image-row');
        // Apply flexbox styles to center children horizontally
        imageRow.style.display = 'flex';
        imageRow.style.justifyContent = 'center';
        imageRow.style.flexWrap = 'wrap'; // Optional, based on your layout needs

        const images = options[selectedOption];

        while (imageRow.firstChild) {
            imageRow.removeChild(imageRow.firstChild);
        }

        images.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            imageRow.appendChild(img);

            if (index < images.length - 1) {
                const arrow = document.createElement('span');
                arrow.innerHTML = '&rarr;';
                arrow.className = 'arrow';
                imageRow.appendChild(arrow);
            }
        });
    }

    function updateImageRow2(selectedOption) {
        const imageRow = document.querySelector('#image-row2');
        // Apply flexbox styles to center children horizontally
        imageRow.style.display = 'flex';
        imageRow.style.justifyContent = 'center';
        imageRow.style.flexWrap = 'wrap'; // Optional, based on your layout needs

        const images = options[selectedOption];

        while (imageRow.firstChild) {
            imageRow.removeChild(imageRow.firstChild);
        }

        images.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            imageRow.appendChild(img);
        });
    }

    try {
        let result = await browser.storage.local.get(['displayOption']);
        if (result.displayOption && options[result.displayOption]) {
            document.getElementById(result.displayOption).checked = true;
            updateImageRow(result.displayOption);
        } else {
            await browser.storage.local.set({displayOption: "switchToSVG"});
            document.getElementById("switchToSVG").checked = true;
            updateImageRow("switchToSVG");
        }
        
        let result2 = await browser.storage.local.get(['displayStyleOption']);
        if (result2.displayStyleOption === "compactView") {
            document.getElementById(result2.displayStyleOption).checked = true;
            updateImageRow2(result2.displayStyleOption);
            browser.runtime.sendMessage({ action: "setTabCountMethod", tabCountMethod: 2 });
        } else {
            await browser.storage.local.set({displayStyleOption: "oneLinePerWindow"});
            document.getElementById("oneLinePerWindow").checked = true;
            updateImageRow2("oneLinePerWindow");
            browser.runtime.sendMessage({ action: "setTabCountMethod", tabCountMethod: 1 });
        }

    } catch (error) {
        console.error('Error loading or setting default options:', error);
    }

    let messageTimeout = null;
    function showStatusMessage(text) {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) return;
        messageDiv.textContent = text;
        messageDiv.style.display = 'block';
        if (messageTimeout) clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => {
            messageDiv.textContent = '';
        }, 2500);
    }

    async function loadWindowList() {
        const windowListContainer = document.getElementById('window-list');
        if (!windowListContainer) return;

        windowListContainer.innerHTML = '';

        try {
            const currentWindow = await browser.windows.getCurrent();
            const windows = await browser.windows.getAll();

            if (windows.length === 0) {
                windowListContainer.textContent = 'No open windows detected.';
                return;
            }

            let windowIndex = 1;
            for (const win of windows) {
                const isCurrent = win.id === currentWindow.id;

                let activeTitle = 'Window ' + windowIndex;
                let loadedCount = 0;
                let totalCount = 0;

                try {
                    const allTabsThisWin = await browser.tabs.query({ windowId: win.id });
                    totalCount = allTabsThisWin.length;
                    loadedCount = allTabsThisWin.filter(t => !t.discarded).length;
                    const activeTab = allTabsThisWin.find(t => t.active);
                    if (activeTab && activeTab.title) {
                        activeTitle = activeTab.title;
                    }
                } catch (err) {
                    console.warn('Could not get tabs for window', win.id, err);
                }

                // Get saved custom name from sessions API
                let savedName = '';
                try {
                    savedName = (await browser.sessions.getWindowValue(win.id, 'windowName')) || '';
                } catch (err) {
                    console.warn('Could not get windowValue for window', win.id, err);
                }

                const windowRow = document.createElement('div');
                windowRow.className = 'window-row';
                windowRow.title = `Window ${windowIndex}: ${activeTitle} (${loadedCount} active / ${totalCount} total tabs)`;

                const infoDiv = document.createElement('div');
                infoDiv.className = 'window-info';

                const numSpan = document.createElement('span');
                numSpan.className = 'window-num';
                numSpan.textContent = `Win ${windowIndex}`;
                infoDiv.appendChild(numSpan);

                const tabCountSpan = document.createElement('span');
                tabCountSpan.className = 'window-tab-count';
                tabCountSpan.textContent = `(${loadedCount}/${totalCount} tabs)`;
                infoDiv.appendChild(tabCountSpan);

                const titleSpan = document.createElement('span');
                titleSpan.className = 'window-title';
                titleSpan.textContent = activeTitle;
                infoDiv.appendChild(titleSpan);

                if (isCurrent) {
                    const badge = document.createElement('span');
                    badge.className = 'window-badge';
                    badge.textContent = 'Current';
                    badge.title = 'Current Window';
                    infoDiv.appendChild(badge);
                }

                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'window-input';
                input.placeholder = `Name (Win${windowIndex})`;
                input.value = savedName;
                input.maxLength = 50;

                let debounceTimer = null;

                const saveWindowName = async () => {
                    const newName = input.value.trim();
                    try {
                        if (newName) {
                            await browser.sessions.setWindowValue(win.id, 'windowName', newName);
                        } else {
                            await browser.sessions.setWindowValue(win.id, 'windowName', '');
                        }

                        showStatusMessage('Window name saved!');
                        await browser.runtime.sendMessage({ action: "updateWindowNames" });
                    } catch (err) {
                        console.error('Failed to save window name for window', win.id, err);
                    }
                };

                input.addEventListener('input', () => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(saveWindowName, 350);
                });

                input.addEventListener('change', () => {
                    clearTimeout(debounceTimer);
                    saveWindowName();
                });

                windowRow.appendChild(infoDiv);
                windowRow.appendChild(input);
                windowListContainer.appendChild(windowRow);

                windowIndex++;
            }
        } catch (error) {
            console.error('Error loading window list:', error);
            windowListContainer.textContent = 'Error loading window list.';
        }
    }

    document.querySelectorAll('input[name="displayOption"]').forEach(radio => {
        radio.addEventListener('change', async function() {
            if (this.checked) {
                try {
                    await browser.storage.local.set({displayOption: this.id});
                    console.log('Badge counter option saved:', this.id);
                    updateImageRow(this.id);
                    showStatusMessage('Badge counter option saved!');

                    let response = await browser.runtime.sendMessage({action: "updateBadge"});
                    console.log("Badge update requested", response);
                } catch (error) {
                    console.error('Error saving display option or updating badge:', error);
                }
            }
        });
    });

    document.querySelectorAll('input[name="displayStyleOption"]').forEach(radio => {
        radio.addEventListener('change', async function() {
            if (this.checked) {
                try {
                    await browser.storage.local.set({displayStyleOption: this.id});
                    console.log('Display option saved:', this.id);
                    updateImageRow2(this.id);
                    showStatusMessage('Display option saved!');

                    if (this.id === "oneLinePerWindow") {
                        browser.runtime.sendMessage({ action: "setTabCountMethod", tabCountMethod: 1 });
                    } else {
                        browser.runtime.sendMessage({ action: "setTabCountMethod", tabCountMethod: 2 });
                    }

                } catch (error) {
                    console.error('Error saving display option or updating badge:', error);
                }
            }
        });
    });

    // Populate the window names editor
    await loadWindowList();
});