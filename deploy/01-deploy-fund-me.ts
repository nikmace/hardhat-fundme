import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { developmentChains, networkConfig } from '../helper-hardhat-config';
import verify from '../utils/verify';

const deployFundMe: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId: number = network.config.chainId!;

  //   const ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed'];
  let ethUsdPriceFeedAddress: string;
  if (developmentChains.includes(network.name)) {
    const ethUsdAgregator = await deployments.get('MockV3Aggregator');
    ethUsdPriceFeedAddress = ethUsdAgregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[network.name].ethUsdPriceFeed!;
  }

  log('----------------------------------------------------');
  log('Deploying FundMe and waiting for confirmations...');
  console.log(`Deployer: ${deployer}`);

  // When going for localhost or hardhat we want to use a mock
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy('FundMe', {
    from: deployer,
    args, // put priceFeed address
    log: true,
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  });

  log(`FundMe deployed at ${fundMe.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    // Verify
    await verify(fundMe.address, args);
  }
  log('--------------------------------------------');
};

export default deployFundMe;
deployFundMe.tags = ['all', 'FundMe'];
