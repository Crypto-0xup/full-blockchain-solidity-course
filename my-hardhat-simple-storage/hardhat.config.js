require ('@nomicfoundation/hardhat-toolbox');
require ('dotenv').config ();
require ('./tasks/block-number');
require ('hardhat-gas-reporter');
require ('solidity-coverage');

/** @type import('hardhat/config').HardhatUserConfig */

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COIN_MARKET_CAP_API_KEY = process.env.COIN_MARKET_CAP_API_KEY;
const LOCALHOST_RPC_URL = process.env.LOCALHOST_RPC_URL;
module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
    },
    localhost: {
      url: LOCALHOST_RPC_URL,
      // accounts: [process.env.LOCALHOST_ACCOUNT_1_PRIVATE_KEY],
      chainId: 31337,
    },
  },
  solidity: '0.8.8',
  etherscan: {
    apikey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    outputFile: 'gas-report.txt',
    noColors: true,
    currency: 'USD',
    coinmarketcap: COIN_MARKET_CAP_API_KEY,
  },
};
