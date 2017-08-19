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

	var cash 
	it("initialize contract", function() {
		return paperCash.new().then(function(_cash) {
			cash = _cash
		})
	});

	it("create grant", function() {
		var amount = web3.toWei(0.01, 'ether')

		return cash.createGrant(hashedKey, {
			from: accOne,
			value: amount 
		})
		.then(function(res) {
			var ev = res.logs[0]
			if (!ev) throw 'no ev'

			assert.equal(ev.args.hashedKey, hashedKey)
			assert.equal(ev.args.amount.toNumber(), amount)
		})
	})


	it("can't claim grant with shit value", function() {
		return new Promise((resolve, reject) => {
			cash.claimGrant(hashedKey, { from: accTwo })
			.then(function() { reject('cant be here: success not allowed') })
			.catch(function(err) {
				if (!err) return reject(new Error('Cant be here'))
					console.log(err.message)
				assert.equal(err.message, 'VM Exception while processing transaction: invalid opcode')
				resolve()
			})
		});
	})
})
