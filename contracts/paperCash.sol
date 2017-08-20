pragma solidity ^0.4.13;

//import "../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract paperCash {
	struct Grant {
		uint amount;
		uint whenWithdrawable;
		address allowedWithdrawee;
	}

	mapping (bytes32 => Grant) grants;
	mapping (bytes32 => bool) claimed;

	function createGrant(bytes32 _hashedKey)
		payable
	{
		require(grants[_hashedKey].amount == 0);
		require(claimed[_hashedKey] == false);

		require(msg.value > 0);

		grants[_hashedKey].amount = msg.value;

		LogGrantCreated(_hashedKey, msg.value);
	}

	function createComplexGrant(bytes32 _hashedKey, uint _whenWithdrawable, address _allowedWithdrawee)
		payable
	{
		require(grants[_hashedKey].amount == 0);
		require(claimed[_hashedKey] == false);

		require(msg.value > 0);

		grants[_hashedKey].amount = msg.value;
		grants[_hashedKey].whenWithdrawable = _whenWithdrawable;
		grants[_hashedKey].allowedWithdrawee = _allowedWithdrawee;

		LogGrantCreated(_hashedKey, msg.value);
	}

	function claimGrant(bytes32 _key) 
	{
		bytes32 hashedKey = sha3(_key);

		require(!claimed[hashedKey]);
		claimed[hashedKey] = true;

		var grant = grants[hashedKey];

		require(grant.amount > 0);
		if (grant.whenWithdrawable != 0) require(now > grant.whenWithdrawable);
		if (grant.allowedWithdrawee != 0) require(msg.sender == grant.allowedWithdrawee);

		require(msg.sender.send(grant.amount));

		LogGrantClaimed(hashedKey, grant.amount);
	}

	function isGrantValid(bytes32 _hashedKey)
		constant
		returns (bool)
	{
		return (grants[_hashedKey].amount > 0 && !claimed[_hashedKey]);
	}

	event LogGrantCreated(bytes32 hashedKey, uint amount);
	event LogGrantClaimed(bytes32 hashedKey, uint amount);
}