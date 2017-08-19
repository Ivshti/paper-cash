#!/usr/bin/env node


var fs = require('fs')
var Web3 = require('web3')
var Tx = require('ethereumjs-tx')
var prompt = require('password-prompt')
var keythereum = require('keythereum')
var minimist = require('minimist')
var crypto = require('crypto')
var SHA3 = require('sha3')
var colors = require('colors')

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
var args = minimist(process.argv, { string: ['privateKey'] })
var cmd = args._[3]

if (['deploy', 'grant', 'claim'].indexOf(cmd) == -1) {
	endWithErr('usage: '+args._[1]+' [path to keystore] [deploy,grant,claim] --amount --')
}

var cashAddr = '0x5a16f165d139796732e2d9bba86bd20c8349d12e'

var cashAbi = JSON.parse(fs.readFileSync('./build-contract/paperCash-bundled.sol:paperCash.abi').toString())
var contract = web3.eth.contract(cashAbi);
var cash = contract.at(cashAddr);

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
	prepare(keyStore, pwd)
}).catch(endWithErr)

//
// Do the important work: deploy, grant or claim
//
var privateKey
function prepare(keyStore, pwd) {
	privateKey = keythereum.recover(pwd, keyStore)

	console.log('private key decrypted successfully')

	if (cmd === 'deploy') deploy()
	else if (cmd === 'grant') {
		if (isNaN(args.amount)) endWithErr('--amount expected, in ether')

		// Generate the keys
		var key = crypto.randomBytes(32)
		var d = new SHA3.SHA3Hash(256);
		var hashedKey = '0x'+d.update(key).digest('hex');

		console.log(colors.red('using PRIVATE key: 0x'+key.toString('hex')));
		console.log('using hashed key '+hashedKey);

		giveGrant(hashedKey, args.amount, function(err) {
			if (err) endWithErr(err)
		})
	} else if (cmd === 'claim') {
		var privKey = args.privateKey
		if (!privKey || privKey.indexOf('0x') !== 0) endWithErr('needs hex --privateKey')

		claimGrant(privKey, function(err) {
			if (err) endWithErr(err)
		})
	}
}

function deploy() 
{
	var bcode = fs.readFileSync('./build-contract/paperCash-bundled.sol:paperCash.bin').toString()
	var payloadData = contract.new.getData({ from: addr, data: '0x'+bcode })

	var gasToDeploy = web3.eth.estimateGas({ data: payloadData }) + 20000

	sendTx(payloadData, undefined, addr, gasToDeploy, 0, function(err, res) {
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
function giveGrant(hashedKey, amount, cb)
{
	//Math.pow(10,18)/(usdPerEth * 100)

	amount = parseFloat(amount)
	if (amount < 0 || amount > 1) return cb(new Error('insane amount'))

	var wei = amount * weiPerEth

	var payloadData = cash.createGrant.getData(hashedKey)
	sendTx(payloadData, cash.address, addr, gas, wei, cb)
}

function claimGrant(privKey, cb)
{
	var payloadData = cash.claimGrant.getData(privKey)
	sendTx(payloadData, cash.address, addr, gas, 0, cb)
}



///
/// HELPERS
///

function sendTx(payload, to, from, gas, value, cb) {
	var nonce = web3.eth.getTransactionCount(addr)

	var rawTx = {
		nonce: web3.toHex(nonce),
		gasPrice: web3.toHex(price),
		gasLimit: web3.toHex(gas),
		from: from,
		value: web3.toHex(value),
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
