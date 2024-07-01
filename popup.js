document.addEventListener('DOMContentLoaded', async function() {
    const options = {
        // Removed nativeBadge option
        switchToSVG: ['./images/BadgeText-9-Cropped.png', './images/BadgeText-99-Cropped.png', './images/BadgeText-999-Cropped.png', './images/SVG-1000-Cropped.png'],
        alwaysSVG: ['./images/SVG-9-Cropped.png', './images/SVG-99-Cropped.png', './images/SVG-999-Cropped.png', './images/SVG-1000-Cropped.png']
    };

    function updateImageRow(selectedOption) {
        const imageRow = document.querySelector('#image-row'); // Updated to target the correct element
        const images = options[selectedOption];
        imageRow.innerHTML = images.map(src => `<img src="${src}" alt="">`).join('&rarr;');
    }

    try {
        let result = await browser.storage.local.get(['displayOption']);
        if (result.displayOption && options[result.displayOption]) { // Check if the stored option exists in the updated options object
            document.getElementById(result.displayOption).checked = true;
            updateImageRow(result.displayOption); // Update image row based on stored option
        } else {
            // If no option is set or the stored option does not exist, default to "switchToSVG"
            await browser.storage.local.set({displayOption: "switchToSVG"});
            document.getElementById("switchToSVG").checked = true;
            updateImageRow("switchToSVG"); // Update image row for default option
        }
    } catch (error) {
        console.error('Error loading or setting default options:', error);
    }

    document.querySelectorAll('input[name="displayOption"]').forEach(radio => {
        radio.addEventListener('change', async function() {
            if (this.checked) {
                try {
                    await browser.storage.local.set({displayOption: this.id});
                    console.log('Display option saved:', this.id);
                    updateImageRow(this.id); // Update image row on option change

                    const messageDiv = document.getElementById('message');
                    messageDiv.textContent = 'User preference saved!';
                    messageDiv.style.display = 'block';
                    
                    setTimeout(() => {
                        messageDiv.textContent = '';
                    }, 2000);

                    let response = await browser.runtime.sendMessage({action: "updateBadge"});
                    console.log("Badge update requested", response);
                } catch (error) {
                    console.error('Error saving display option or updating badge:', error);
                }
            }
        });
    });
});