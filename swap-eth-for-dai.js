const Web3 = require('web3')
const {ERC20S, RINKEBY_DAI_CONTRACT} = require('/home/ben/Downloads/defi_bot/defi-bot/src/examples/coins/erc20');
const {UNISWAP_V2_EXCHANGE_ABI, UNISWAP_V2_EXCHANGE_ADDRESS, RINKEBY_UNISWAP_FACTORY_ADDRESS} = require('/home/ben/Downloads/defi_bot/defi-bot/src/examples/exchange/uniswap')
const {rinkebyInfuraURL} = require('/home/ben/Downloads/defi_bot/defi-bot/src/examples/constants')

web3 = new Web3(rinkebyInfuraURL);

// Ropsten Uniswap UniswapV2Router02: https://ropsten.etherscan.io/address/0x7a250d5630b4cf539739df2c5dacb4c659f2488d
const exchangeContract = new web3.eth.Contract(UNISWAP_V2_EXCHANGE_ABI, UNISWAP_V2_EXCHANGE_ADDRESS);

// Set Deadline 1 minute from now
const moment = require('moment') // import moment.js library
const now = moment().unix() // fetch current unix timestamp
const DEADLINE = now + 15 // add 60 seconds

// Transaction Settings
const SETTINGS = {
    gasLimit: 6000000, // Override gas settings: https://github.com/ethers-io/ethers.js/issues/469
    gasPrice: web3.utils.toWei('50', 'Gwei'),
    from: '0x44dDd4501eE8c55AAF80658E50a67Ac4ae8Faa79', // Use your account here
    value: web3.utils.toWei('1', 'Ether'), // Amount of Ether to Swap
    privKey: '92cb180d402b4b95807e91392f2fac9c73fb30a98445169381af7bc2486da0e8'
}

function checkTokenSymbol(token_symbol){
  try{
      if (ERC20S[token_symbol]) {
              console.log('token symbol: ', token_symbol)
              return true
          }
  }
  catch(error) {
      console.log('token symbol: ', token_symbol, ' not exited!')
      return
  }
}

/** Script converts 0.01 ETH to DAI. Script:
 *  # gets WETH address - WETH()
 *  # checks how much DAI can be swapped for 0.01 ETH - getAmountsOut()
 *  # performs swap - swapETHForExactTokens()
 */
async function swapEthToToken(tokenSymbol) {
try {

  if (!checkTokenSymbol(tokenSymbol)){
    console.log('token symbol: ', tokenSymbol, ' not exited!')
    return
  }
    let balance1
    //rel = await web3.eth.getTransaction('0xf5a3219484c1cf7736e53e9c5c4d23fd415537195210908a4a2459c4a50bc34e')
    //console.log(rel)
    // Check Ether balance BEFORE swap
    balance1 = await getEthBalance(SETTINGS.from)
    balance1 = web3.utils.fromWei(balance1, 'Ether')
    console.log("Ether Balance:", balance1)

    // Check Dai balance BEFORE swap
    balance2 = await getERC20TokenBalance(tokenSymbol, SETTINGS.from)
    balance2 = web3.utils.fromWei(balance2, 'Ether')
    console.log("Dai Balance:", balance2)

    // Get WETH address
    const WETH_ADDRESS = await exchangeContract.methods.WETH().call()
    console.log("WETH address: ", WETH_ADDRESS)
    token_address = ERC20S[tokenSymbol].address
    console.log(tokenSymbol, ' address: ', token_address)
    // Array of tokens addresses
    const pairArray = [WETH_ADDRESS, token_address]

    //get DAI amount for 0.01 ETH
    const tokenAmount = await exchangeContract.methods.getAmountsOut(SETTINGS.value, pairArray).call()
    console.log(`0.01 ETH will be swapped to ${web3.utils.fromWei(tokenAmount[1], 'Ether')} ${tokenSymbol}`);
    eth_price = parseFloat(tokenAmount[1]) / parseFloat(SETTINGS.value)

    // Perform Swap
    console.log('\nPerforming swap...')
    const encodeABI = await exchangeContract.methods.swapETHForExactTokens(tokenAmount[1].toString(), pairArray, SETTINGS.from, DEADLINE).encodeABI()
    console.log("encodeABI: ")
    console.log(encodeABI)


    const tx_nonce = await web3.eth.getTransactionCount(SETTINGS.from)
    console.log('tx count: ', tx_nonce)

    const txData = {
      nonce: web3.utils.toHex(tx_nonce),
      gasLimit: web3.utils.toHex(6000000),
      gasPrice: web3.utils.toHex(web3.utils.toWei('50', 'Gwei')), // 10 Gwei
      to: UNISWAP_V2_EXCHANGE_ADDRESS,
      from: SETTINGS.from,
      value: web3.utils.toHex(SETTINGS.value), // Amount of Ether to Swap
      data: encodeABI
    }

    const signedTx = await web3.eth.accounts.signTransaction(txData, "0x"+ SETTINGS.privKey.toString('hex'));
    console.log('Send signed tx...')
    const result = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
    //console.log('result: ' , result)
    if (result.transactionHash) {
      console.log(`Successful Swap: https://ropsten.etherscan.io/tx/${result.transactionHash}`)

      // Check Ether balance AFTER swap
      balance1_1 = await web3.eth.getBalance(SETTINGS.from)
      balance1_1 = web3.utils.fromWei(balance1_1, 'Ether')
      console.log("\nEther Balance:", balance1_1)

      // Check Dai balance AFTER swap
      balance2_2 = await RINKEBY_DAI_CONTRACT.methods.balanceOf(SETTINGS.from).call()
      balance2_2 = web3.utils.fromWei(balance2_2, 'Ether')
      console.log("Dai Balance:", balance2_2)

      cost_eth = parseFloat(balance1) - parseFloat(balance1_1)
      received_token  = parseFloat(balance2_2) - parseFloat(balance2)
      return {Status:'200', TxHash:result.transactionHash, Cost_Eth:cost_eth, Received_Token:received_token, Eth_Price:eth_price}
    }else if(result.error) {
      console.log('error: ', result.error);
      return error;
    }else {
      console.log('swap failed!')
      return
    }
  }
  catch(error) {
    console.log('swap failed! Error: ', error)
    return {Status:'False', Error: error}
  }
}
swapEthToToken('DAI').then((rel) => {
  console.log(rel)
})


async  function  getEthBalance(address) {
  let balance
  //rel = await web3.eth.getTransaction('0xf5a3219484c1cf7736e53e9c5c4d23fd415537195210908a4a2459c4a50bc34e')
  //console.log(rel)
  // Check Ether balance BEFORE swap
  balance = await web3.eth.getBalance(address)
  //balance = web3.utils.fromWei(balance, 'Ether')
  //console.log("Ether Balance:", balance)
  return balance
}


async function getERC20TokenBalance(tokenSymbol, address) {
  try{
      balance = await ERC20S[tokenSymbol].contract.methods.balanceOf(address).call()
      return balance
  }
  catch(error) {
      console.log(error)
      return
  }
}