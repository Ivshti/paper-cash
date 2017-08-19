pragma solidity ^0.4.13;

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract paperCash is Ownable {
	mapping (bytes32 => uint) grants;

	function createGrant(bytes32 _hashedKey)
		payable
	{
		
	}

	function claimGrant(bytes32 _key) 
	{

	}
}