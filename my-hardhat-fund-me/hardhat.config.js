require ('@nomicfoundation/hardhat-toolbox');
require ('dotenv').config ();
require ('hardhat-gas-reporter');
require ('solidity-coverage');
require ('hardhat-deploy');

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
      blockConfirmations: 6,
    },
    localhost: {
      url: LOCALHOST_RPC_URL,
      // accounts: [process.env.LOCALHOST_ACCOUNT_1_PRIVATE_KEY],
      chainId: 31337,
    },
  },
  solidity: {
    compilers: [{version: '0.8.8'}, {version: '0.6.6'}],
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    outputFile: 'gas-report.txt',
    noColors: true,
    currency: 'USD',
    token: 'ETH',
    // coinmarketcap: COIN_MARKET_CAP_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
};
