// imports
const {ethers, run, network} = require ('hardhat');

//  async main
async function main () {
  const SimpleStorageFactory = await ethers.getContractFactory (
    'SimpleStorage'
  );
  console.log ('Deploying contract...');
  const simpleStorage = await SimpleStorageFactory.deploy ();
  await simpleStorage.deployed ();

  console.log (`Deployed contract to ${simpleStorage.address}`);
  if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
    // 等待6个区块
    await simpleStorage.deployTransaction.wait (6);
    // 验证合约
    await verify (simpleStorage.address, []);
  }

  // 获取合约的当前值
  const currentValue = await simpleStorage.retrieve ();
  console.log (`Current Values is ${currentValue}`);

  // 更新值
  const transactionResponse = await simpleStorage.store (7);
  await transactionResponse.wait (1);

  // 获取最新的值
  const updatedValue = await simpleStorage.retrieve ();
  console.log (`Current Values is ${updatedValue}`);
}

// 验证合约
async function verify (contractAddress, args) {
  console.log ('Verifing Contract');
  try {
    await run ('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowercase ().include ('already verified')) {
      console.log ('Already Verified!');
    } else {
      console.log (e);
    }
  }
}

// main
main ().then (() => process.exit (0)).catch (error => {
  console.error (error);
  process.exit (1);
});
