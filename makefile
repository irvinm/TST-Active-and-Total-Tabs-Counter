xpi: 
	rm -f ./*.xpi
	zip -r -9 TST-Active-and-Total-Tabs-Counter.xpi images manifest.json background.js icon.png popup.html popup.js -x '*/.*' >/dev/null 2>/dev/null
