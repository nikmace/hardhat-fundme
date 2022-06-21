import { deployments, ethers, network } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';

import { FundMe, MockV3Aggregator } from '../../typechain-types';
import { developmentChains } from '../../helper-hardhat-config';

describe('FundMe', () => {
  let fundMe: FundMe;
  let deployer: SignerWithAddress;
  let mockV3Aggregator: MockV3Aggregator;

  const sendValue = ethers.utils.parseEther('1'); // 1e18

  beforeEach(async () => {
    // deploy our fundMe contract
    // const account = await ethers.getSigners();
    // const accountZero = account[0];
    if (!developmentChains.includes(network.name)) {
      throw 'You need to be on a development chain to run tests';
    }

    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    await deployments.fixture(['all']);

    fundMe = await ethers.getContract('FundMe', deployer);

    mockV3Aggregator = await ethers.getContract('MockV3Aggregator', deployer);
  });

  describe('constructor', () => {
    it('sets the aggregator addresses correctly', async () => {
      const response = await fundMe.getPriceFeed();

      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe('fund', () => {
    it('fails if not enough eth is sent', async () => {
      await expect(fundMe.fund()).to.be.revertedWith(
        'You need to spend more ETH!'
      );
    });
    it('update the amount funded data structure', async () => {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAddressToAmountFunded(deployer.address);
      assert.equal(response.toString(), sendValue.toString());
    });
    it('Adds funder to array of funders', async () => {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.getFunder(0);
      assert.equal(funder, deployer.address);
    });
  });

  describe('withdraw', () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue });
    });

    it('Eth from a single founder', async () => {
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );

      const txResponse = await fundMe.withdraw();
      const txReceipt = await txResponse.wait(1);

      const gasCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );

      assert.equal(endingFundMeBalance.toString(), '0');
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });

    it('only allows the owner to withdraw funds', async () => {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];

      const attackerConnectedContract = await fundMe.connect(attacker);
      await expect(attackerConnectedContract.withdraw()).to.be.reverted;
    });

    it('is allows us to withdraw with multiple funders', async () => {
      // Arrange
      const accounts = await ethers.getSigners();
      await fundMe
        .connect(accounts[1])
        .fund({ value: ethers.utils.parseEther('1') });
      await fundMe
        .connect(accounts[2])
        .fund({ value: ethers.utils.parseEther('1') });
      await fundMe
        .connect(accounts[3])
        .fund({ value: ethers.utils.parseEther('1') });
      await fundMe
        .connect(accounts[4])
        .fund({ value: ethers.utils.parseEther('1') });
      await fundMe
        .connect(accounts[5])
        .fund({ value: ethers.utils.parseEther('1') });
      // Act
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );
      const transactionResponse = await fundMe.withdraw();
      // Let's comapre gas costs :)
      // const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait();
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
      console.log(`GasCost: ${withdrawGasCost}`);
      console.log(`GasUsed: ${gasUsed}`);
      console.log(`GasPrice: ${effectiveGasPrice}`);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );
      // Assert
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(withdrawGasCost).toString()
      );
      await expect(fundMe.getFunder(0)).to.be.reverted;
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[1].address)).toString(),
        '0'
      );
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[2].address)).toString(),
        '0'
      );
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[3].address)).toString(),
        '0'
      );
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[4].address)).toString(),
        '0'
      );
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[5].address)).toString(),
        '0'
      );
    });

    it('cheaper withdraw', async () => {
      // Arrange
      const accounts = await ethers.getSigners();
      await fundMe
        .connect(accounts[1])
        .fund({ value: ethers.utils.parseEther('1') });
      await fundMe
        .connect(accounts[2])
        .fund({ value: ethers.utils.parseEther('1') });
      await fundMe
        .connect(accounts[3])
        .fund({ value: ethers.utils.parseEther('1') });
      await fundMe
        .connect(accounts[4])
        .fund({ value: ethers.utils.parseEther('1') });
      await fundMe
        .connect(accounts[5])
        .fund({ value: ethers.utils.parseEther('1') });
      // Act
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );
      const transactionResponse = await fundMe.cheaperWithdraw();
      // Let's comapre gas costs :)
      // const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait();
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
      console.log(`GasCost: ${withdrawGasCost}`);
      console.log(`GasUsed: ${gasUsed}`);
      console.log(`GasPrice: ${effectiveGasPrice}`);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );
      // Assert
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(withdrawGasCost).toString()
      );
      await expect(fundMe.getFunder(0)).to.be.reverted;
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[1].address)).toString(),
        '0'
      );
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[2].address)).toString(),
        '0'
      );
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[3].address)).toString(),
        '0'
      );
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[4].address)).toString(),
        '0'
      );
      assert.equal(
        (await fundMe.getAddressToAmountFunded(accounts[5].address)).toString(),
        '0'
      );
    });
  });
});
