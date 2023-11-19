#!/bin/sh -e
cd "$(dirname "$0")"
mkdir -p data
cd data
NAME=2023.10.0.tar.gz
[ -f "$NAME" ] || curl -Lo "$NAME" https://github.com/Hypfer/Valetudo/archive/refs/tags/"$NAME"
tar -xvzf "$NAME" --wildcards '*/backend/test/*/map/*.json' | node ../test.js
