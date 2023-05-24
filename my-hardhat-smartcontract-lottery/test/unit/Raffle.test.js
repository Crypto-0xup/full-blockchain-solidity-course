const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect } = require("chai")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle,
              vrfCoordinatorV2Mock,
              raffleEntranceFee,
              deployer,
              interval
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              // 部署所有带all标签的合约
              await deployments.fixture(["all"])
              // 部署后获取raffle合约
              raffle = await ethers.getContract("Raffle", deployer)
              // 部署后获取vrfCoordinatorV2Mock合约
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })

          describe("constructor", async function () {
              it("initializes the raflle correctly", async function () {
                  const raffleState = (await raffle.getRaffleState()).toString()
                  const interval = await raffle.getInterval()
                  assert(raffleState, "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId][
                          "keepersUpdateInterval"
                      ]
                  )
              })
          })

          describe("enterRaffle", function () {
              it("reverts when you don't pay enough", async function () {
                  await expect(raffle.enterRaffle()).to.revertedWith(
                      "Raffle__NotETHEnoughEntered"
                  )
              })

              it("records player when they enter", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })

              it("emits event on enter", async function () {
                  // emit中有两个参数，第一个合约，第一个event名字
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.emit(raffle, "RaffleEnter")
              })

              it("doesn't allow entrance when raffle is calculatings", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                  // 增加时间
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })

                  //   await network.provider.send("evm_mine", [])
                  // pretend to be a ChainLink keeper
                  await raffle.performUpkeep([])
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.revertedWith(
                      // is reverted as raffle is calculating
                      "Raffle__NotOpen"
                  )
              })
          })

          describe("checkUpkeep", function () {
              it("return false if people haven't sent any ETH", async function () {
                  // 增加时间
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  // 增加区块
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      "0x"
                  )
                  // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })

              it("return false if raffle isn't open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                  // 增加时间
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })

                  // await network.provider.send("evm_mine", [])
                  // pretend to be a ChainLink keeper
                  await raffle.performUpkeep([])
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      "0x"
                  )
                  assert.equal(
                      raffleState.toString() == "1",
                      upkeepNeeded == false
                  )
              })

              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  // 没有超过时间间隔
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() - 5,
                  ]) // use a higher number here if this test fails
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      "0x"
                  ) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })

              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      "0x"
                  ) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })

          describe("performUpkeep", function () {
              it("can only run if checkupkeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const tx = await raffle.performUpkeep("0x")
                  const txReceipt = await tx.wait()
                  console.log(`txReceipt is ${txReceipt}`)
                  assert(tx)
              })

              it("revert if checkup is false", async function () {
                  await expect(raffle.performUpkeep("0x")).to.revertedWith(
                      "Raffle__UpkeepNotNeeded"
                  )
              })

              it("updates the raffle state and emits a requestId", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const txResponse = await raffle.performUpkeep("0x") // emits requestId
                  const txReceipt = await txResponse.wait(1) // wait 1 block
                  const raffleState = await raffle.getRaffleState() // updates state
                  const requestId = txReceipt.events[1].args.requestId
                  console.log(`requestId is ${requestId}`)
                  assert.equal(raffleState.toString(), "1") // open = 0,calculating = 1
                  assert(requestId > 0) // uint256
              })
          })

          describe("fulfillRandomWords", function () {
              // 保证「checkUpkeep」能够满足条件
              beforeEach(async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
              })

              it("can only be called after performupkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address) // reverts if not fulfilled
                  ).to.revertedWith("nonexistent request")
              })

              // This test is too big...
              // This test simulates users entering the raffle and wraps the entire functionality of the raffle
              // inside a promise that will resolve if everything is successful.
              // An event listener for the WinnerPicked is set up
              // Mocks of chainlink keepers and vrf coordinator are used to kickoff this winnerPicked event
              // All the assertions are done once the WinnerPicked event is fired
              it("picks a winner, resets, and sends money", async () => {
                  const accounts = await ethers.getSigners()
                  const additionalEntrances = 3
                  const startingIndex = 1 // deployer = 0
                  for (
                      let i = startingIndex;
                      i < startingIndex + additionalEntrances;
                      i++
                  ) {
                      // 连接到合约
                      raffle = raffle.connect(accounts[i]) // // Returns a new instance of the Raffle contract connected to player
                      // 入场
                      await raffle.enterRaffle({ value: raffleEntranceFee })
                  }
                  const totalPlayers = await raffle.getNumberOfPlayers()
                  assert.equal(
                      startingIndex + additionalEntrances,
                      totalPlayers
                  )
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  await new Promise(async (resolve, reject) => {
                      // event listener for WinnerPicked
                      raffle.once("WinnerPicked", async () => {
                          // event listener for WinnerPicked
                          console.log("WinnerPicked event fired!")
                          // assert throws an error if it fails, so we need to wrap
                          // it in a try/catch so that the promise returns event
                          // if it fails.
                          try {
                              // Now lets get the ending values...
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              console.log(`recentWinner is ${recentWinner}`)
                              const raffleState = await raffle.getRaffleState()
                              const winnerBalance =
                                  await accounts[1].getBalance()
                              const endingTimeStamp =
                                  await raffle.getLastTimeStamp()
                              await expect(raffle.getPlayer(0)).to.reverted
                              // Comparisons to check if our ending values are correct:
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[1].address
                              )
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerBalance.toString(),
                                  startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                      .add(
                                          raffleEntranceFee
                                              .mul(additionalEntrances)
                                              .add(raffleEntranceFee)
                                      )
                                      .toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve() // if try passes, resolves the promise
                          } catch (e) {
                              reject(e) // if try fails, rejects the promise
                          }
                      })

                      // 在promise里面进行调用请求
                      const tx = await raffle.performUpkeep("0x")
                      const txReceipt = await tx.wait(1)
                      // 初始的balance
                      const startingBalance = await accounts[1].getBalance()
                      console.log(
                          `accounts[1] address is ${accounts[1].address}`
                      )
                      // 第二个参数，consumer，意思是谁调用的
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          raffle.address
                      )
                  })
              })
          })
      })
