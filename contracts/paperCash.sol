pragma solidity ^0.4.13;

//import "../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract paperCash {
	mapping (bytes32 => uint) grants;

	function createGrant(bytes32 _hashedKey)
		payable
	{
		require(msg.value > 0);
		grants[_hashedKey] = msg.value;
	}

	function claimGrant(bytes32 _key) 
	{
		uint grant = grants[sha3(_key)];
		require(grant > 0);
		require(msg.sender.send(grant));
	}
}