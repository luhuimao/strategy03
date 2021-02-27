const Web3 = require('web3');
const abis = require('../abis.json')
const ABI = abis.ArbitrageABI
const CONTRACT_ADDRESS = "0xb05740690c8013bb33085f0428D69863974Bc435"

const provider = new Web3.providers.HttpProvider(process.env.INFURA_RINKEBY_ENDPOINT)
const web3 = new Web3(provider)
//onst web3 = new Web3(process.env.INFURA_RINKEBY_ENDPOIN);

const contranct_instance = new web3.eth.Contract(
	ABI,
	CONTRACT_ADDRESS
);
UNISWAP_V2_EXCHANGE_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const exchangeContract = new web3.eth.Contract(abis.UNISWAP_V2_EXCHANGE_ABI, UNISWAP_V2_EXCHANGE_ADDRESS);
const WETH_ADDRESS = "0xc778417E063141139Fce010982780140Aa0cD5Ab"
const DAI_ADDRESS_RINKEBY = "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735"



const DAI_ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"INITIAL_SUPPLY","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_value","type":"uint256"}],"name":"burnFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_burner","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]
const daiContract = new web3.eth.Contract(DAI_ABI, DAI_ADDRESS_RINKEBY);

// Set Deadline 1 minute from now
const moment = require('moment'); // import moment.js library


(async () => {
	try{
        const pairArray = [WETH_ADDRESS, DAI_ADDRESS_RINKEBY]

        // await swapTokenToEth(DAI_ADDRESS_RINKEBY)

        // let tokenAmount1 = await exchangeContract.methods.getAmountsOut(web3.utils.toWei("2", "ether"), pairArray).call()    
        // console.log(`output DAI amount: ${tokenAmount1[1]}`)

        await swapEthToToken(DAI_ADDRESS_RINKEBY, 10)


        // // let DAI_balance = await daiContract.methods.balanceOf( process.env.ACCOUNT_ADDDRESS_RINKEBY).call()
        // // console.log(`DAI Balance: ${DAI_balance}  type: ${typeof(DAI_balance)}`)

        // let tokenAmount2 = await exchangeContract.methods.getAmountsOut(tokenAmount1[1], [DAI_ADDRESS_RINKEBY, WETH_ADDRESS]).call()    

        // const tx = await contranct_instance.methods.runArbitrage(DAI_ADDRESS_RINKEBY, web3.utils.toWei('2', "ether"))
        // const gas_cost = await web3.eth.estimateGas({
        //     from: process.env.ACCOUNT_ADDDRESS_RINKEBY,
        //     to: CONTRACT_ADDRESS,
        //     data: tx.encodeABI()
        //   })
        // const tx_cost = web3.utils.toBN(web3.utils.toWei('1', 'Gwei')).mul(gas_cost)
        // let profit = web3.utils.toBN(tokenAmount2[1].toString()).sub(web3.utils.toBN(web3.utils.toWei("2", "ether"))).sub(tx_cost)

        // if (profit > 0) {
        //     console.log(`profit : ${web3.utils.fromWei(profit)} ETH`)
        // }


        
	}
	catch(error){
		console.log(`ERROR: ${error}`)
	}
})();



async function swapEthToToken(token_address, eth_amount) {
    try {       
        const pairArray = [WETH_ADDRESS, token_address]
    
        const tokenAmount = await exchangeContract.methods.getAmountsOut(web3.utils.toWei(eth_amount.toString()), pairArray).call()    
        console.log('\nPerforming swap...')
        const now = moment().unix() // fetch current unix timestamp
        const DEADLINE = now + 60 ;// add 60 seconds
        const  tx = await exchangeContract.methods.swapExactETHForTokens(
            tokenAmount[1].toString(),
            pairArray, 
            process.env.ACCOUNT_ADDDRESS_RINKEBY, 
            DEADLINE
        )    
    
        const tx_nonce = await web3.eth.getTransactionCount(process.env.ACCOUNT_ADDDRESS_RINKEBY)
        console.log('tx count: ', tx_nonce)
    
        const txData = {
          nonce: web3.utils.toHex(tx_nonce),
          gasLimit: web3.utils.toHex(6000000),
          gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'Gwei')), // 10 Gwei
          to: UNISWAP_V2_EXCHANGE_ADDRESS,
          from: process.env.ACCOUNT_ADDDRESS_RINKEBY,
          value: web3.utils.toHex(web3.utils.toWei(eth_amount.toString())), // Amount of Ether to Swap
          data: tx.encodeABI()
        }
    
        const signedTx = await web3.eth.accounts.signTransaction(txData, "0x"+ process.env.ACCOUNT_PRIVATE_KEY_RINKEBY.toString('hex'));
        console.log('Send signed tx...')
        const result = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
        //console.log('result: ' , result)
        if (result.transactionHash) {
          console.log(`Successful Swap: https://ropsten.etherscan.io/tx/${result.transactionHash}`)
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

async function swapTokenToEth(token_address) {
    try {       
        const pairArray = [ token_address, WETH_ADDRESS]
    
        let DAI_balance = await daiContract.methods.balanceOf( process.env.ACCOUNT_ADDDRESS_RINKEBY).call()
    
        console.log(`DAI Balance: ${DAI_balance}  type: ${typeof(DAI_balance)}`)

        const approveEncodedABI = daiContract.methods.approve(UNISWAP_V2_EXCHANGE_ADDRESS, DAI_balance).encodeABI()

        let txData = {
            gasLimit: web3.utils.toHex(6000000),
            gasPrice: web3.utils.toHex(web3.utils.toWei('1', 'Gwei')), // 10 Gwei
            to: DAI_ADDRESS_RINKEBY,
            from:  process.env.ACCOUNT_ADDDRESS_RINKEBY,
            data: approveEncodedABI
        }

        let signedTx = await web3.eth.accounts.signTransaction(txData, "0x"+ process.env.ACCOUNT_PRIVATE_KEY_RINKEBY.toString('hex'));
        console.log('Send signed tx...')
        let result = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);


        const ethAmount = await exchangeContract.methods.getAmountsOut(DAI_balance, pairArray).call()    
        // Perform Swap
        console.log('\nPerforming swap...')

        const now = moment().unix() // fetch current unix timestamp
        const DEADLINE = now + 15 ;// add 60 seconds
        const encodeABI = await exchangeContract.methods.swapExactTokensForETH(
            DAI_balance,
            ethAmount[1].toString(),
            pairArray,
            process.env.ACCOUNT_ADDDRESS_RINKEBY, 
            DEADLINE
        ).encodeABI()    
    
        const tx_nonce = await web3.eth.getTransactionCount(process.env.ACCOUNT_ADDDRESS_RINKEBY)
        console.log('tx count: ', tx_nonce)
    
        txData = {
          nonce: web3.utils.toHex(tx_nonce),
          gasLimit: web3.utils.toHex(6000000),
          gasPrice: web3.utils.toHex(web3.utils.toWei('1', 'Gwei')), // 10 Gwei
          to: UNISWAP_V2_EXCHANGE_ADDRESS,
          from: process.env.ACCOUNT_ADDDRESS_RINKEBY,
          data: encodeABI
        }
    
        signedTx = await web3.eth.accounts.signTransaction(txData, "0x"+ process.env.ACCOUNT_PRIVATE_KEY_RINKEBY.toString('hex'));
        console.log('Send signed tx...')
        result = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
        //console.log('result: ' , result)
        if (result.transactionHash) {
          console.log(`Successful Swap: https://ropsten.etherscan.io/tx/${result.transactionHash}`)
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