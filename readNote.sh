#!/usr/bin/env bash

PKEY=`fswebcam --resolution 1024x720 /tmp/cam.jpg ; zbarimg /tmp/cam.jpg`
if [ ! $? -eq 0  ]; then
	echo "Error"
	exit $?
fi

./cli.js $1 claim --privateKey $PKEY