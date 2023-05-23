const {network} = require ('hardhat');
const {networkConfig, developmentChains} = require ('../helper-hardhat-config');
const {verify} = require ('../utils/verify');
require ('dotenv').config ();

module.exports = async ({getNamedAccounts, deployments}) => {
  const {deploy, log} = deployments;
  const {deployer} = await getNamedAccounts ();
  const chainId = network.config.chainId;

  // 喂价地址
  let ethUsdPriceFeedAddress;
  if (chainId == 31337) {
    const ethUsdAggregator = await deployments.get ('MockV3Aggregator');
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    log ('goerli price feed address....');
    ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed'];
  }
  log ('----------------------------------------------------');
  log ('Deploying FundMe and waiting for confirmations...');
  const fundMe = await deploy ('FundMe', {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log (`FundMe deployed at ${fundMe.address}`);

  if (
    // 如果不是在本地部署的，那么就需要验证下是否在其他链上部署了
    !developmentChains.includes (network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    // 验证合约
    // 验证合约后，可以在区块链浏览器中看到源代码
    await verify (fundMe.address, [ethUsdPriceFeedAddress]);
  }
};

module.exports.tags = ['all', 'fundme'];
