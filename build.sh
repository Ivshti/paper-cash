#!/usr/bin/env bash

mkdir -p build-contract
./bundle.sh ./contracts/paperCash.sol > paperCash-bundled.sol
solcjs --optimize --bin -o build-contract paperCash-bundled.sol
solcjs --optimize --abi -o build-contract paperCash-bundled.sol
