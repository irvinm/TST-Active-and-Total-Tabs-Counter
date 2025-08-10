#!/bin/sh

name=TST-Active-and-Total-Tabs-Counter

[ -e $name.xpi ] && rm $name.xpi
zip -r $name.zip background.js manifest.json popup.html popup.js popup.css images
mv $name.zip $name.xpi
