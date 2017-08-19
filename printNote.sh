#!/usr/bin/env bash

if [ ! "$1" ]; then
	echo "Error: keystore file required"
	exit 1
fi

if [ ! "$2" ]; then
	echo "Error: amount"
	exit 1
fi

QRCODE=$(./cli.js $1 grant --amount $2 | grep "QR:" | cut -d" " -f3)

echo $QRCODE

curl "$QRCODE" > /tmp/qr.png

composite -dissolve 60% /tmp/qr.png -gravity center ./notes/rollsafe.jpg  /tmp/banknote.jpg
convert /tmp/banknote.jpg -gravity South -background YellowGreen -splice 0x18 -annotate +0+2 '$2 ETH' /tmp/banknote.jpg

echo /tmp/banknote.jpg
