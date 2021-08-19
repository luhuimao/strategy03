const Web3 = require('web3');
const {ERC20S} = require('/home/ben/Downloads/defi_bot/defi-bot/src/examples/coins/erc20');
const {UNISWAP_V2_EXCHANGE_ABI, UNISWAP_V2_EXCHANGE_ADDRESS} = require('/home/ben/Downloads/defi_bot/defi-bot/src/examples/exchange/uniswap')
// const expandTo18Decimals = require('./utilities');
web3 = new Web3('https://ropsten.infura.io/v3/665990aec24c4a54a0fa9ef783aada8c');

// Ropsten DAI Token: https://ropsten.etherscan.io/token/0xad6d458402f60fd3bd25163575031acdce07538d
const DAI_ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_value","type":"uint256"}],"name":"burnFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_burner","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]
const DAI_ADDRESS = '0xad6d458402f60fd3bd25163575031acdce07538d'
const daiContract = new web3.eth.Contract(DAI_ABI, DAI_ADDRESS);

// Ropsten Uniswap UniswapV2Router02: https://ropsten.etherscan.io/address/0x7a250d5630b4cf539739df2c5dacb4c659f2488d
const exchangeContract = new web3.eth.Contract(UNISWAP_V2_EXCHANGE_ABI, UNISWAP_V2_EXCHANGE_ADDRESS);

// Set Deadline 1 minute from now
const moment = require('moment') // import moment.js library
const now = moment().unix() // fetch current unix timestamp
const DEADLINE = now + 20 // add 60 seconds

// Transaction Settings
const SETTINGS = {
    gasLimit: 6000000, // Override gas settings: https://github.com/ethers-io/ethers.js/issues/469
    gasPrice: web3.utils.toWei('50', 'Gwei'),
    from: '0x861024e95cb0e5d481e838531dd5f2fad9691901', // Use your account here
    value: web3.utils.toWei('0.01', 'Ether'), // Amount of Ether to Swap
    privKey: '',
    tokenValue: web3.utils.toWei('10', 'Ether'), // Amount of Token to Swap
}


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
async function swapTokenToETH(tokenSymbol) {
try {
    if (!checkTokenSymbol(tokenSymbol)){
        console.log('token symbol: ', tokenSymbol, ' not exited!')
        return
    }
    //console.log(expandTo18Decimals(5))
    let balance
    //rel = await web3.eth.getTransaction('0xf5a3219484c1cf7736e53e9c5c4d23fd415537195210908a4a2459c4a50bc34e')
    //console.log(rel)
    // Check Ether balance BEFORE swap
    balance = await getEthBalance(SETTINGS.from)
    balance = web3.utils.fromWei(balance, 'Ether')
    console.log("Ether Balance:", balance)

    // Check Dai balance BEFORE swap
    balance = await getERC20TokenBalance(tokenSymbol, SETTINGS.from)
    balance = web3.utils.fromWei(balance, 'Ether')
    console.log("Dai Balance:", balance)

    // Get WETH address
    const WETH_ADDRESS = await exchangeContract.methods.WETH().call()
    console.log("WETH address: ", WETH_ADDRESS)
    // Array of tokens addresses
    token_address = ERC20S[tokenSymbol].address
    console.log(tokenSymbol, ' address: ', token_address)
    const pairArray = [token_address, WETH_ADDRESS]

    //get ETH amount for SETTINGS.tokenValue DAI
    const ethAmount = await exchangeContract.methods.getAmountsIn(SETTINGS.tokenValue, [WETH_ADDRESS, token_address]).call()
    console.log(`${web3.utils.fromWei(SETTINGS.tokenValue, 'ether')} ${tokenSymbol} will be swapped to ${web3.utils.fromWei(ethAmount[0], 'Ether')} ETH`);
    //The amount of ETH to receive.
    const ethToReceive = ethAmount[0]
    console.log('The amount of ETH to receive: ', ethToReceive)
    //The maximum amount of input tokens that can be required before the transaction reverts.
    const maxRequiredTokenAmount = SETTINGS.tokenValue
    console.log('The maximum amount of input tokens that can be required before the transaction reverts: ' , maxRequiredTokenAmount)
    // Perform Swap
    console.log('\nPerforming swap...')
    const encodeABI = await exchangeContract.methods.swapTokensForExactETH(ethToReceive, web3.utils.toWei(balance, 'Ether'), pairArray, SETTINGS.from, DEADLINE).encodeABI()

    const tx_nonce = await web3.eth.getTransactionCount(SETTINGS.from)
    console.log('tx count: ', tx_nonce)

    const txData = {
      nonce: web3.utils.toHex(tx_nonce),
      gasLimit: web3.utils.toHex(6000000),
      gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'Gwei')), // 10 Gwei
      to: UNISWAP_V2_EXCHANGE_ADDRESS,
      from: SETTINGS.from,
      data: encodeABI
    }

    const signedTx = await web3.eth.accounts.signTransaction(txData, "0x"+ SETTINGS.privKey.toString('hex'));
    console.log('Send signed tx...')
    const result = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
    if (result.transactionHash) {
      console.log(`Successful Swap: https://ropsten.etherscan.io/tx/${result.transactionHash}`)

      // Check Ether balance AFTER swap
      balance = await web3.eth.getBalance(SETTINGS.from)
      balance = web3.utils.fromWei(balance, 'Ether')
      console.log("\nEther Balance:", balance)

      // Check Dai balance AFTER swap
      balance = await daiContract.methods.balanceOf(SETTINGS.from).call()
      balance = web3.utils.fromWei(balance, 'Ether')
      console.log("Dai Balance:", balance)

      return result.transactionHash
    }else if(result.error) {
      console.log('error', error);
      return error;
    }else {
      console.log('swap failed!')
      return
    }
  }
  catch(error) {
    console.log(error)
  }
}
//ApproveDAIExchange(10, 200)
swapTokenToETH('DAI')
//getERC20TokenBalance('DAI',SETTINGS.from)


async function ApproveDAIExchange(gas_price = 10, approveTokenAmount) {
	const TOKENS = web3.utils.toHex(parseFloat(approveTokenAmount) * 10 ** 18); // 1 DAI
    const approveEncodedABI = daiContract.methods.approve(EXCHANGE_ADDRESS, TOKENS).encodeABI()

	const tx_nonce = await web3.eth.getTransactionCount(SETTINGS.from)
	console.log('tx count: ', tx_nonce)

	const txData = {
		nonce: web3.utils.toHex(tx_nonce),
		gasLimit: web3.utils.toHex(6000000),
		gasPrice: web3.utils.toHex(web3.utils.toWei(gas_price.toString(), 'Gwei')), // 10 Gwei
		to: DAI_ADDRESS,
		from: SETTINGS.from,
		data: approveEncodedABI
	}

	const signedTx = await web3.eth.accounts.signTransaction(txData, "0x"+ SETTINGS.privKey.toString('hex'));
	console.log('Send signed tx...')
	const result = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
	if (result.transactionHash) {
		console.log(`Successful Swap: https://ropsten.etherscan.io/tx/${result.transactionHash}`)
		return result.transactionHash
	}else if(result.error) {
		console.log('error', error);
		return error;
	}else {
		console.log('swap failed!')
		return
	}
}
