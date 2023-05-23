import {ethers} from './ethers-5.6.esm.min.js';
import {abi, contractAddress} from './constants.js';

// 获取元素
const connectButton = document.getElementById ('connectButton');
const withdrawButton = document.getElementById ('withdrawButton');
const fundButton = document.getElementById ('fundButton');
const balanceButton = document.getElementById ('balanceButton');

// 定义方法名
connectButton.onclick = connect;
withdrawButton.onclick = withdraw;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;

// 声明方法
async function connect () {
  console.log ('connecting....');
  if (typeof window.ethereum !== 'undefined') {
    try {
      // 连接钱包
      await ethereum.request ({method: 'eth_requestAccounts'});
    } catch (error) {
      console.log (error);
    }
    connectButton.innerHTML = 'Connected!';
    // 获取账户
    const account = await ethereum.request ({method: 'eth_accounts'});
    console.log (account);
  } else {
    connectButton.innerHTML = 'Please install Metamask';
  }
}

// fund
async function fund () {
  const ethAmount = document.getElementById ('ethAmount').value;
  console.log (`Funding with ethAmount：${ethAmount}`);
  if (typeof window.ethereum !== 'undefined') {
    const provider = new ethers.providers.Web3Provider (window.ethereum);
    const signer = provider.getSigner ();
    // 合约地址、abi、签名者
    const contract = new ethers.Contract (contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.fund ({
        value: ethers.utils.parseEther (ethAmount),
      });
      // 监听区块确认，「同步」
      await listenForTransactionMine (transactionResponse, provider);
      console.log ('Done!');
    } catch (error) {
      console.log (error);
    }
  } else {
    fundButton.innerHTML = 'Please install Metamask';
  }
}

// 获取余额
async function getBalance () {
  if (typeof window.ethereum !== 'undefined') {
    const provider = new ethers.providers.Web3Provider (window.ethereum);
    try {
      const balance = await provider.getBalance (contractAddress);
      console.log (ethers.utils.formatEther (balance));
    } catch (error) {
      console.log (error);
    }
  } else {
    balanceButton.innerHTML = 'Please install MetaMask';
  }
}

// 提现
async function withdraw () {
  console.log ('Withdrawing...');
  if (typeof window.ethereum !== 'undefined') {
    // 拿到合约
    const provider = new ethers.providers.Web3Provider (window.ethereum);
    const signer = provider.getSigner ();
    const contract = new ethers.Contract (contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.withdraw ();
      await listenForTransactionMine (transactionResponse, provider);
    } catch (error) {
      console.log (error);
    }
  } else {
    withdrawButton.innerHTML = 'Please install Metamask';
  }
}

// 监听区块
function listenForTransactionMine (transactionResponse, provider) {
  console.log (`Mining ${transactionResponse.hash}...`);
  return new Promise ((resolve, reject) => {
    // provider这里的once方法只会执行一次
    provider.once (transactionResponse.hash, transactionReceipt => {
      console.log (
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
      resolve ();
    });
  });
}
