// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";

/* Errors */
error Raffle__NotETHEnoughEntered();
error Raflle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 raffleState
);

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type Declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    /* State Variables */
    // Chainlink VRF Variables
    // 合约
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    // gas上限
    bytes32 private immutable i_gasLane;
    // 订阅id
    uint64 private immutable i_subscriptionId;
    // gasLimit
    uint32 private immutable i_callbackGasLimit;
    // 确认区块数
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    // 想获取的随机数的数量
    uint32 private constant NUM_WORDS = 1;

    // Lottery Variables
    // 入场费
    uint256 private immutable i_entranceFee;
    // 玩家数组
    address payable[] private s_players;
    // 最近获胜的玩家
    address private s_recentWinner;
    // Raffle状态
    RaffleState private s_raffleState;
    // 区块时间
    uint256 private s_lastTimeStamp;
    // 时间间隔
    uint256 private immutable i_interval;

    /* Events */
    event RaffleEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    /* Functions */
    constructor(
        address vrfCoordinatorV2, // contract address
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    fallback() external payable {}

    receive() external payable {}

    /**
     * 玩家入场
     */
    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotETHEnoughEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    // 被合约内部调用的方法，重写的接口的方法
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        // i为请求的随机数的数量
        // words[i] = uint256(keccak256(abi.encode(_requestId, i)));
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        // change state
        s_raffleState = RaffleState.OPEN;
        // after a round raffle,reset the players array
        s_players = new address payable[](0);
        // reset lastTimestamp
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Raflle__TransferFailed();
        }
        // 得到随机数，发送事件
        emit WinnerPicked(recentWinner);
    }

    /* KEEPERS */
    /**
     * @dev This is the function that the Chainlink Keeper nodes call
     *  they look for the `upkeepNeeded` to return true.
     *  The following should be true in order to return true.
     *  1、Our time interval should have passed.
     *  2、The lottery should have at least 1 player and have some ETH.
     *  3、Our subscription is funded with LINK
     *  4、The lottery should be in "open" state
     */
    function checkUpkeep(
        bytes memory /* calldata */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = RaffleState.OPEN == s_raffleState;
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
        return (upkeepNeeded, "0x0");
    }

    /**
     * @dev Once `checkUpkeep` is returning `true`, this function is called
     * and it kicks off a Chainlink VRF call to get a random winner.
     */
    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        // lottering...
        // change state
        s_raffleState = RaffleState.CALCULATING;
        // 返回请求id
        uint256 requestID = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestID);
    }

    /** Getter Functions */

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }
}
