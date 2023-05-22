const {ethers} = require ('hardhat');
const {expect, assert} = require ('chai');

describe ('SimpleStorage', () => {
  let simpleStorageFactory, simpleStorage;

  // 在测试之前所做的事
  beforeEach (async function () {
    simpleStorageFactory = await ethers.getContractFactory ('SimpleStorage');
    simpleStorage = await simpleStorageFactory.deploy ();
  });

  // 测试用例
  it ('Should start with a favorite number of 0', async function () {
    const currentValue = await simpleStorage.retrieve ();
    const expectValue = '0';
    // assert
    // expect
    assert.equal (currentValue.toString (), expectValue);
  });

  it ('Should update when we call store', async function () {
    const transactionResponse = await simpleStorage.store (7);
    await transactionResponse.wait (1);

    // 获取最新的值
    const updatedValue = await simpleStorage.retrieve ();
    assert.equal (updatedValue, 7);
  });
});
