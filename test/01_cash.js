var paperCash = artifacts.require("./paperCash.sol")
var Promise = require('bluebird')

var SHA3 = require('sha3')
var crypto = require('crypto')

var key = crypto.randomBytes(32)

var d = new SHA3.SHA3Hash(256);
var hashedKey = '0x'+d.update(key).digest('hex');

console.log('using hashed key '+hashedKey);

contract('paperCash', function(accounts) {
	var accOne = web3.eth.accounts[0]
	var accTwo = web3.eth.accounts[1]
	var accThree = web3.eth.accounts[2]

	var cash 
	it("initialize contract", function() {
		return paperCash.new().then(function(_cash) {
			cash = _cash
		})
	});
	
	var amount = web3.toWei(0.01, 'ether')
	var accTwoStart

	it("create grant", function() {

		return cash.createGrant(hashedKey, {
			from: accOne,
			value: amount 
		})
		.then(function(res) {
			var ev = res.logs[0]
			if (!ev) throw 'no ev'

			assert.equal(ev.args.hashedKey, hashedKey)
			assert.equal(ev.args.amount.toNumber(), amount)

			return web3.eth.getBalance(accTwo)
		})
		.then(function(bal) {
			accTwoStart = bal.toNumber()
		})
	})

	it("grant is valid", function() {
		return cash.isGrantValid(hashedKey)
		.then(function(isValid) {
			assert.equal(isValid, true)
		})
	})

	it("can't claim grant with shit value", function() {
		return new Promise((resolve, reject) => {
			cash.claimGrant(hashedKey, { from: accThree })
			.then(function() { reject('cant be here: success not allowed') })
			.catch(function(err) {
				if (!err) return reject(new Error('Cant be here'))
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
		});
	})

	it("claim grant", function() {

		var gasUsed = 0;

		return cash.claimGrant('0x'+key.toString('hex'), { from: accTwo, gasPrice: web3.toHex(10000000000) })
		.then(function(res) {
			var ev = res.logs[0]
			if (!ev) throw 'no ev'

			gasUsed += res.receipt.cumulativeGasUsed

			assert.equal(ev.args.hashedKey, hashedKey)
			assert.equal(ev.args.amount.toNumber(), amount)

			return web3.eth.getBalance(accTwo)
		})
		.then(function(bal) {
			// check if we have the moneyz
			/// complex because of gas

			//console.log(accTwoStart, bal.toNumber())
			//console.log(bal.toNumber()-accTwoStart, parseInt(amount))

			//console.log(bal.toNumber() + (gasUsed * 10000000000), accTwoStart + parseInt(amount))
			assert.equal(bal.toNumber() + (gasUsed * 10000000000), accTwoStart + parseInt(amount))

		})


	})


	it("grant is no longer valid", function() {
		return cash.isGrantValid(hashedKey)
		.then(function(isValid) {
			assert.equal(isValid, false)
		})
	})

	it("can't claim grant twice", function() {
		return new Promise((resolve, reject) => {
			cash.claimGrant('0x'+key.toString('hex'), { from: accTwo })
			.then(function() { reject('cant be here: success not allowed') })
			.catch(function(err) {
				if (!err) return reject(new Error('Cant be here'))
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
		});
	})
})
