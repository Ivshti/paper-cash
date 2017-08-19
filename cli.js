#!/usr/bin/env node


var fs = require('fs')
var Web3 = require('web3')
var Tx = require('ethereumjs-tx')
var prompt = require('password-prompt')
var keythereum = require('keythereum')
var minimist = require('minimist')

//
// Hardcodes
//
//var HTTP_PROVIDER = 'http://192.168.0.32:8181'
var HTTP_PROVIDER = 'https://mainnet.infura.io/W0a3PCAj1UfQZxo5AIrv'

var web3 = new Web3(new Web3.providers.HttpProvider(HTTP_PROVIDER))

var price = 4599515020 // low price
var gas = 64988

//
// Preparation
//
var args = minimist(process.argv, { })
var cmd = args._[2]

if (['deploy', 'grant'].indexOf(cmd) == -1) {
	endWithErr('usage: '+args._[1]+' [deploy,grant] --amount --')
}

var cashAddr = ''

var cashAbi = JSON.parse(fs.readFileSync('./build-contract/paperCash-bundled_sol_paperCash.abi').toString())
var contract = web3.eth.contract(cashAbi);


//
// Decrypting keystore
//
var jsonFile = args._[2]
if (! jsonFile) endWithErr('no json file')

var keyStore
try {
	keyStore = JSON.parse(fs.readFileSync(jsonFile).toString())
} catch(e) { endWithErr(e) }

var addr = '0x'+keyStore.address.toLowerCase()


prompt('keystore password: ', { method: 'hide' })
.then(function(pwd) {
	prepareForSig(keyStore, pwd)
}).catch(endWithErr)


var privateKey
function prepareForSig(keyStore, pwd) {
	privateKey = keythereum.recover(pwd, keyStore)

	console.log('private key decrypted successfully')

	if (cmd === 'deploy') deploy()
	else {
		// TODO: check args
		grant()
	}
}

function deploy() 
{
	var bcode = fs.readFileSync('./build-contract/paperCash-bundled_sol_paperCash.bin').toString()
	var payloadData = contract.new.getData({ from: addr, data: '0x'+bcode })

	var gasToDeploy = web3.eth.estimateGas({ data: payloadData }) + 20000

	sendTx(payloadData, undefined, addr, gasToDeploy, function(err, res) {
		if (err) endWithErr(err)
		console.log('deployed, tx: ', res)
		waitForTransactionReceipt(res)
	})

}

function waitForTransactionReceipt(hash) {
	console.log('waiting for contract to be mined');
	var receipt = web3.eth.getTransactionReceipt(hash);
	// If no receipt, try again in 1s
	if (receipt == null) {
		setTimeout(() => {
			waitForTransactionReceipt(hash);
		}, 1000);
	} else {
		// The transaction was mined, we can retrieve the contract address
		console.log('contract address: ' + receipt.contractAddress);
		process.exit(0)
	}
}

var weiPerEth = Math.pow(10, 18)
function submitPrice(oracle, done)
{
	//Math.pow(10,18)/(usdPerEth * 100)

	getEthPriceNow()
	.then(function(data) {
		//console.log(data);
		var when = Object.keys(data)[0]
		var prices = data[when]
		var timestamp = new Date(when).getTime()

		console.log('ETH-USD: '+prices.ETH.USD)

		var weiPerCent = Math.round(weiPerEth / (prices.ETH.USD * 100))

		var payloadData = oracle.submitPrice.getData(timestamp, weiPerCent)
		sendTx(payloadData, oracle.address, addr, gas, done)
	}).catch(endWithErr)
}


///
/// HELPERS
///

function sendTx(payload, to, from, gas, cb) {
	var nonce = web3.eth.getTransactionCount(addr)

	var rawTx = {
		nonce: web3.toHex(nonce),
		gasPrice: web3.toHex(price),
		gasLimit: web3.toHex(gas),
		from: from,
		value: web3.toHex(0),
		data: payload,
	};

	if (to) rawTx.to = to;

	var tx = new Tx(rawTx)
	tx.sign(privateKey)

	var serializedTx = tx.serialize()

	console.log('sending tx:', serializedTx.toString('hex'))
		
	web3.eth.sendRawTransaction('0x'+serializedTx.toString('hex'), cb)
}

function endWithErr(err) {
	console.error(err)
	process.exit(1)
}
