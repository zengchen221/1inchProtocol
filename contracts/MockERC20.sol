pragma solidity >=0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        
    ) public ERC20() {
        // _mint(msg.sender, supply);
    }
}