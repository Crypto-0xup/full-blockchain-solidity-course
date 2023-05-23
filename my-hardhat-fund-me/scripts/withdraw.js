const {getNamedAccounts, ethers} = require ('hardhat');

async function main () {
  const {deployer} = getNamedAccounts;
  // 拿到合约
  const fundMe = await ethers.getContract ('FundMe', deployer);
  const transactionResponse = await fundMe.withdraw ();
  await transactionResponse.wait (1);
  console.log ('Got it!');
}

main ().then (() => process.exit (0)).catch (error => {
  console.error (error);
  process.exit (1);
});
