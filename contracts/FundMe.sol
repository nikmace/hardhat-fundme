// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import './PriceConverter.sol';

/**
  @title A contract for crowd funding
  @author nkmcntsh
  @notice This contract is to demo samle crowd funding contract
  @dev This implements price feeds as our library
 */
contract FundMe {
  using PriceConverter for uint256;

  mapping(address => uint256) private s_addressToAmountFunded;
  address[] private s_funders;
  address private immutable i_owner;
  AggregatorV3Interface public s_priceFeed;

  modifier onlyOwner() {
    require(msg.sender == i_owner);
    _;
  }

  constructor(address priceFeed) {
    s_priceFeed = AggregatorV3Interface(priceFeed);
    i_owner = msg.sender;
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  /**
  @notice This function funds this contract, and keeps track of funders & the amount they sent
  @dev This implements price feeds as our library
 */
  function fund() public payable {
    uint256 minimumUSD = 50 * 10**18;
    require(
      msg.value.getConversionRate(s_priceFeed) >= minimumUSD,
      'You need to spend more ETH!'
    );
    // require(PriceConverter.getConversionRate(msg.value) >= minimumUSD, "You need to spend more ETH!");
    s_addressToAmountFunded[msg.sender] += msg.value;
    s_funders.push(msg.sender);
  }

  /**
  @notice This function withdraws funds to owner of this contract
  @dev This implements price feeds as our library
 */
  function withdraw() public payable onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
    for (
      uint256 funderIndex = 0;
      funderIndex < s_funders.length;
      funderIndex++
    ) {
      address funder = s_funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);

    (bool success, ) = payable(msg.sender).call{ value: address(this).balance }(
      ''
    );

    require(success, 'Transfer failed');
  }

  function cheaperWithdraw() public payable onlyOwner {
    // Copy s_funders array to memory, because it is cheaper
    address[] memory funders = s_funders;
    for (uint256 funderIdx = 0; funderIdx < funders.length; funderIdx++) {
      address funder = funders[funderIdx];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);

    (bool success, ) = i_owner.call{ value: address(this).balance }('');

    require(success, 'Transfer failed');
  }

  // View / Pure functions
  function getOwner() public view returns (address) {
    return i_owner;
  }

  function getFunder(uint256 index) public view returns (address) {
    return s_funders[index];
  }

  function getAddressToAmountFunded(address funder)
    public
    view
    returns (uint256)
  {
    return s_addressToAmountFunded[funder];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }
}
