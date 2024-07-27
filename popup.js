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

    document.querySelectorAll('input[name="displayOption"]').forEach(radio => {
        radio.addEventListener('change', async function() {
            if (this.checked) {
                try {
                    await browser.storage.local.set({displayOption: this.id});
                    console.log('Badge counter option saved:', this.id);
                    updateImageRow(this.id);

                    const messageDiv = document.getElementById('message');
                    messageDiv.textContent = 'Badge counter option saved!';
                    messageDiv.style.display = 'block';
                    
                    setTimeout(() => {
                        messageDiv.textContent = '';
                    }, 3000);

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

                    const messageDiv = document.getElementById('message');
                    messageDiv.textContent = 'Display option saved!';
                    messageDiv.style.display = 'block';
                    
                    setTimeout(() => {
                        messageDiv.textContent = '';
                    }, 3000);

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
});