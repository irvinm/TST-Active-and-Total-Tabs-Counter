document.addEventListener('DOMContentLoaded', async function() {
    const options = {
        switchToSVG: ['./images/BadgeText-9-Cropped.png', './images/BadgeText-99-Cropped.png', './images/BadgeText-999-Cropped.png', './images/SVG-1000-Cropped.png'],
        alwaysSVG: ['./images/SVG-9-Cropped.png', './images/SVG-99-Cropped.png', './images/SVG-999-Cropped.png', './images/SVG-1000-Cropped.png']
    };

    const badgeStages = [
        { label: '1–9' },
        { label: '10–99' },
        { label: '100–999' },
        { label: '1000+' }
    ];

    function updateBadgePreview(selectedOption) {
        const previewContainer = document.querySelector('#badge-preview');
        if (!previewContainer) return;

        const images = options[selectedOption];
        if (!images) return;

        let html = '<div class="badge-stage-container">';
        images.forEach((src, index) => {
            const stageLabel = badgeStages[index] ? badgeStages[index].label : '';
            html += `
                <div class="badge-stage">
                    <img src="${src}" alt="${stageLabel} tabs">
                    <span class="badge-caption">${stageLabel}</span>
                </div>
            `;
            if (index < images.length - 1) {
                html += '<span class="badge-arrow">&rarr;</span>';
            }
        });
        html += '</div>';

        previewContainer.innerHTML = html;
    }

    function updateSidebarPreview(selectedOption) {
        const previewContainer = document.querySelector('#sidebar-preview');
        if (!previewContainer) return;

        if (selectedOption === 'oneLinePerWindow') {
            previewContainer.innerHTML = `
                <div class="sidebar-preview-table">
                    <div class="sidebar-preview-row">
                        <span class="preview-label">Work:</span>
                        <span class="preview-act">12</span>
                        <span class="preview-slash">/</span>
                        <span class="preview-tot">145</span>
                        <span class="preview-unit">tabs</span>
                    </div>
                    <div class="sidebar-preview-row">
                        <span class="preview-label">Social:</span>
                        <span class="preview-act">8</span>
                        <span class="preview-slash">/</span>
                        <span class="preview-tot">210</span>
                        <span class="preview-unit">tabs</span>
                    </div>
                    <div class="sidebar-preview-row">
                        <span class="preview-label">Win3:</span>
                        <span class="preview-act">4</span>
                        <span class="preview-slash">/</span>
                        <span class="preview-tot">22</span>
                        <span class="preview-unit">tabs</span>
                    </div>
                    <div class="sidebar-preview-row">
                        <span class="preview-label">Win4:</span>
                        <span class="preview-act">1</span>
                        <span class="preview-slash">/</span>
                        <span class="preview-tot">9</span>
                        <span class="preview-unit">tabs</span>
                    </div>
                    <div class="sidebar-preview-row">
                        <span class="preview-label">Total:</span>
                        <span class="preview-act">25</span>
                        <span class="preview-slash">/</span>
                        <span class="preview-tot">386</span>
                        <span class="preview-unit">tabs</span>
                    </div>
                </div>
            `;
        } else {
            previewContainer.innerHTML = `
                <div class="sidebar-preview-compact">
                    <span class="preview-item">Work: 12/145</span>, 
                    <span class="preview-item">Social: 8/210</span>, 
                    <span class="preview-item">W3: 4/22</span>, 
                    <span class="preview-item">W4: 1/9</span>, 
                    <span class="preview-item">T: 25/386</span>
                </div>
            `;
        }
    }

    function updateOptionCardSelection() {
        document.querySelectorAll('.option-card').forEach(card => {
            const radio = card.querySelector('input[type="radio"]');
            if (radio && radio.checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    try {
        let result = await browser.storage.local.get(['displayOption']);
        if (result.displayOption && options[result.displayOption]) {
            document.getElementById(result.displayOption).checked = true;
            updateBadgePreview(result.displayOption);
        } else {
            await browser.storage.local.set({displayOption: "switchToSVG"});
            document.getElementById("switchToSVG").checked = true;
            updateBadgePreview("switchToSVG");
        }
        updateOptionCardSelection();
        
        let result2 = await browser.storage.local.get(['displayStyleOption']);
        if (result2.displayStyleOption === "compactView") {
            document.getElementById(result2.displayStyleOption).checked = true;
            updateSidebarPreview(result2.displayStyleOption);
            updateOptionCardSelection();
            browser.runtime.sendMessage({ action: "setTabCountMethod", tabCountMethod: 2 });
        } else {
            await browser.storage.local.set({displayStyleOption: "oneLinePerWindow"});
            document.getElementById("oneLinePerWindow").checked = true;
            updateSidebarPreview("oneLinePerWindow");
            updateOptionCardSelection();
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

                // Truncate active tab title if very long to keep row width compact
                const MAX_TITLE_LENGTH = 28;
                let displayTitle = activeTitle;
                if (displayTitle.length > MAX_TITLE_LENGTH) {
                    displayTitle = displayTitle.substring(0, MAX_TITLE_LENGTH - 3) + '...';
                }

                const titleSpan = document.createElement('span');
                titleSpan.className = 'window-title';
                titleSpan.textContent = displayTitle;
                titleSpan.title = activeTitle;
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
                    updateBadgePreview(this.id);
                    updateOptionCardSelection();
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
                    updateSidebarPreview(this.id);
                    updateOptionCardSelection();
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

    // Navigation tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.getAttribute('data-tab');

            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const targetContent = document.getElementById(targetTabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Populate the window names editor
    await loadWindowList();
});