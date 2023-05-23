// 此文件是在本地部署可以进行喂价的mock
const {network} = require ('hardhat');
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require ('../helper-hardhat-config');

module.exports = async ({getNamedAccounts, deployments}) => {
  const {deploy, log} = deployments;
  const {deployer} = await getNamedAccounts ();
  const chainId = network.config.chainId;
  // If we are on a local development network, we need to deploy mocks!
  if (chainId == 31337) {
    // 本地部署
    log ('Local network detected! Deploying mocks...');
    await deploy ('MockV3Aggregator', {
      contract: 'MockV3Aggregator',
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    // 部署完成
    log ('Mocks Deployed!');
    log ('------------------------------------------------');
  }
};
module.exports.tags = ['all', 'mocks'];
