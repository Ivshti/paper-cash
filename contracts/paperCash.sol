pragma solidity ^0.4.13;

//import "../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract paperCash {
	mapping (bytes32 => uint) grants;
	mapping (bytes32 => bool) claimed;

	function createGrant(bytes32 _hashedKey)
		payable
	{
		require(grants[_hashedKey] == 0);
		require(claimed[_hashedKey] == false);
		
		require(msg.value > 0);
		grants[_hashedKey] = msg.value;
	}

	function claimGrant(bytes32 _key) 
	{
		bytes32 hashedKey = sha3(_key);

		require(!claimed[hashedKey]);
		claimed[hashedKey] = true;

		uint grant = grants[hashedKey];
		require(grant > 0);

		require(msg.sender.send(grant));
	}
}