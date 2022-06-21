import { assert } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { network, ethers, getNamedAccounts } from 'hardhat';

import { developmentChains } from '../../helper-hardhat-config';
import { FundMe, MockV3Aggregator } from '../../typechain-types';

developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe Staging Tests', async function () {
      let deployer;
      let fundMe: FundMe;

      const sendValue = ethers.utils.parseEther('0.1');

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract('FundMe', deployer);
      });

      it('allows people to fund and withdraw', async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.cheaperWithdraw({
          gasLimit: 100000,
        });

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        console.log(
          endingFundMeBalance.toString() +
            ' should equal 0, running assert equal...'
        );

        assert.equal(endingFundMeBalance.toString(), '0');
      });
    });
