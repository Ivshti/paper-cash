var paperCash = artifacts.require("./paperCash.sol")
var Promise = require('bluebird')

contract('paperCash', function(accounts) {
	var accOne = web3.eth.accounts[0]

	it("initialize contract", function() {
		return paperCash.new().then(function(_cash) {
			console.log(_cash)
		})
	});

})
