

async function swapETHForToken(token_address){
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