const SUN_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const MOON_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

let currentPageTheme = "light";

function setSvgContent(element, svgString) {
    try {
        const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
        element.replaceChildren(doc.documentElement);
    } catch (_) {
        element.textContent = '';
    }
}

function applyPageTheme(theme, save = false) {
    currentPageTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", currentPageTheme);

    const pageThemeBtn = document.getElementById("page-theme-btn");
    const pageThemeIcon = document.getElementById("page-theme-icon");
    if (pageThemeBtn && pageThemeIcon) {
        if (currentPageTheme === "dark") {
            setSvgContent(pageThemeIcon, SUN_SVG);
            pageThemeBtn.title = "Switch to light theme";
            pageThemeBtn.setAttribute("aria-label", "Switch to light theme");
        } else {
            setSvgContent(pageThemeIcon, MOON_SVG);
            pageThemeBtn.title = "Switch to dark theme";
            pageThemeBtn.setAttribute("aria-label", "Switch to dark theme");
        }
    }

    if (save && typeof browser !== "undefined" && browser.storage && browser.storage.local) {
        browser.storage.local.set({ pageTheme: currentPageTheme }).catch((err) => {
            console.warn("Failed to save pageTheme:", err);
        });
    }
}

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

        previewContainer.replaceChildren();
        const stageContainer = document.createElement('div');
        stageContainer.className = 'badge-stage-container';

        images.forEach((src, index) => {
            const stageLabel = badgeStages[index] ? badgeStages[index].label : '';
            const stage = document.createElement('div');
            stage.className = 'badge-stage';

            const img = document.createElement('img');
            img.src = src;
            img.alt = `${stageLabel} tabs`;

            const caption = document.createElement('span');
            caption.className = 'badge-caption';
            caption.textContent = stageLabel;

            stage.appendChild(img);
            stage.appendChild(caption);
            stageContainer.appendChild(stage);

            if (index < images.length - 1) {
                const arrow = document.createElement('span');
                arrow.className = 'badge-arrow';
                arrow.textContent = '→';
                stageContainer.appendChild(arrow);
            }
        });

        previewContainer.appendChild(stageContainer);
    }

    function updateSidebarPreview(layout, scope) {
        const previewContainer = document.querySelector('#sidebar-preview');
        if (!previewContainer) return;

        const currentLayout = layout || (document.querySelector('input[name="displayStyleOption"]:checked')?.value || 'oneLinePerWindow');
        const currentScope = scope || (document.querySelector('input[name="sidebarScopeOption"]:checked')?.value || 'all');

        if (currentLayout === 'oneLinePerWindow') {
            if (currentScope === 'current') {
                previewContainer.innerHTML = `
                    <div class="sidebar-preview-table">
                        <div class="sidebar-preview-row">
                            <span class="preview-label">Work:</span>
                            <span class="preview-act">12</span>
                            <span class="preview-slash">/</span>
                            <span class="preview-tot">145</span>
                            <span class="preview-unit">tabs</span>
                        </div>
                    </div>
                `;
            } else {
                previewContainer.innerHTML = `
                    <div class="sidebar-preview-table">
                        <div class="sidebar-preview-row">
                            <span class="preview-label">*Work:</span>
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
            }
        } else {
            if (currentScope === 'current') {
                previewContainer.innerHTML = `
                    <div class="sidebar-preview-compact">
                        <span class="preview-item">Work: 12/145</span>
                    </div>
                `;
            } else {
                previewContainer.innerHTML = `
                    <div class="sidebar-preview-compact">
                        <span class="preview-item">*Work: 12/145</span>, 
                        <span class="preview-item">Social: 8/210</span>, 
                        <span class="preview-item">W3: 4/22</span>, 
                        <span class="preview-item">W4: 1/9</span>, 
                        <span class="preview-item">T: 25/386</span>
                    </div>
                `;
            }
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
            browser.runtime.sendMessage({ action: "setTabCountMethod", tabCountMethod: 2 });
        } else {
            await browser.storage.local.set({displayStyleOption: "oneLinePerWindow"});
            document.getElementById("oneLinePerWindow").checked = true;
            browser.runtime.sendMessage({ action: "setTabCountMethod", tabCountMethod: 1 });
        }

        let scopeRes = await browser.storage.local.get(['sidebarScopeOption', 'badgeScopeOption']);
        const sidebarScope = scopeRes.sidebarScopeOption || 'all';
        if (sidebarScope === 'current') {
            document.getElementById('sidebarScopeCurrent').checked = true;
        } else {
            document.getElementById('sidebarScopeAll').checked = true;
        }

        const badgeScope = scopeRes.badgeScopeOption || 'all';
        if (badgeScope === 'current') {
            document.getElementById('badgeScopeCurrent').checked = true;
        } else {
            document.getElementById('badgeScopeAll').checked = true;
        }

        updateSidebarPreview(result2.displayStyleOption || 'oneLinePerWindow', sidebarScope);
        updateOptionCardSelection();

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
            const windows = await browser.windows.getAll({ windowTypes: ['normal'] });

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
                    updateSidebarPreview(this.id, null);
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

    document.querySelectorAll('input[name="sidebarScopeOption"]').forEach(radio => {
        radio.addEventListener('change', async function() {
            if (this.checked) {
                try {
                    await browser.storage.local.set({sidebarScopeOption: this.value});
                    console.log('Sidebar scope saved:', this.value);
                    updateSidebarPreview(null, this.value);
                    updateOptionCardSelection();
                    showStatusMessage('Sidebar scope saved!');
                    browser.runtime.sendMessage({ action: "updateSidebarScope", sidebarScopeOption: this.value });
                } catch (error) {
                    console.error('Error saving sidebar scope:', error);
                }
            }
        });
    });

    document.querySelectorAll('input[name="badgeScopeOption"]').forEach(radio => {
        radio.addEventListener('change', async function() {
            if (this.checked) {
                try {
                    await browser.storage.local.set({badgeScopeOption: this.value});
                    console.log('Badge scope saved:', this.value);
                    updateOptionCardSelection();
                    showStatusMessage('Badge scope saved!');
                    browser.runtime.sendMessage({ action: "updateBadgeScope", badgeScopeOption: this.value });
                } catch (error) {
                    console.error('Error saving badge scope:', error);
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

    // Header Actions: Theme Toggle & Open in Tab
    const pageThemeBtn = document.getElementById('page-theme-btn');
    if (pageThemeBtn) {
        pageThemeBtn.addEventListener('click', () => {
            const nextTheme = currentPageTheme === 'dark' ? 'light' : 'dark';
            applyPageTheme(nextTheme, true);
        });
    }

    try {
        const stored = await browser.storage.local.get('pageTheme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = stored && stored.pageTheme ? stored.pageTheme : (prefersDark ? 'dark' : 'light');
        applyPageTheme(initialTheme, false);
    } catch (_) {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyPageTheme(prefersDark ? 'dark' : 'light', false);
    }

    const openTabBtn = document.getElementById('open-tab-btn');
    if (openTabBtn) {
        openTabBtn.addEventListener('click', () => {
            const url = (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL)
                ? browser.runtime.getURL('popup.html?mode=tab')
                : 'popup.html?mode=tab';

            if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.create) {
                browser.tabs.create({ url }).finally(() => {
                    window.close();
                });
            } else {
                window.open(url, '_blank');
                window.close();
            }
        });
    }

    // Check if opened in full tab
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'tab' || window.innerWidth > 550) {
        document.body.classList.remove('popup-view');
        document.body.classList.add('tab-view');
    }

    // Populate the window names editor
    await loadWindowList();
});

if (typeof browser !== 'undefined' && browser.storage && browser.storage.onChanged) {
    browser.storage.onChanged.addListener((changes) => {
        if (changes && changes.pageTheme && changes.pageTheme.newValue) {
            applyPageTheme(changes.pageTheme.newValue, false);
        }
    });
}