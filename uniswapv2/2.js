const Web3 = require('web3');
const abis = require('../abis.json')
const ABI = abis.ArbitrageABI
const CONTRACT_ADDRESS = "0xb05740690c8013bb33085f0428D69863974Bc435"

const provider = new Web3.providers.HttpProvider(process.env.INFURA_RINKEBY_ENDPOINT)
const web3 = new Web3(provider)
const DAI_ADDRESS_RINKEBY = "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735"

const contranct_instance = new web3.eth.Contract(
	ABI,
	CONTRACT_ADDRESS
);

UNISWAP_V2_EXCHANGE_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const exchangeContract = new web3.eth.Contract(abis.UNISWAP_V2_EXCHANGE_ABI, UNISWAP_V2_EXCHANGE_ADDRESS);
const WETH_ADDRESS = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

(async () => {

    web3.eth.getBalance(CONTRACT_ADDRESS).then(result => {
        console.log(`contract account balance : ${web3.utils.fromWei(result)}`)
    })

    let tokenAmount1 = await exchangeContract.methods.getAmountsOut(web3.utils.toWei("2", "ether"), [WETH_ADDRESS,DAI_ADDRESS_RINKEBY ]).call()    
    console.log(`output DAI amount: ${tokenAmount1[1]}`)

    let tx = await contranct_instance.methods.swapExactETHForTokensUniswap(
        web3.utils.toWei('2', "ether"),
        DAI_ADDRESS_RINKEBY
    )

    let gas_cost1 = await web3.eth.estimateGas({
        from: "0x570dC83f03fc09e65Cb7D61Ccc4559f01C9D6063",
        to: CONTRACT_ADDRESS,
        data: tx.encodeABI()
    })

    let txData = {
        // nonce: web3.utils.toHex(tx_nonce),
        gasLimit: web3.utils.toHex(600000),
        gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'Gwei')), // 10 Gwei
        to: CONTRACT_ADDRESS,
        from: "0x570dC83f03fc09e65Cb7D61Ccc4559f01C9D6063",
        data: tx.encodeABI()
      }
  


      const signedTx = await web3.eth.accounts.signTransaction(txData, "0x" + "2d25dcf11d253452d1def8ac93ac6da7a1d06b41536a15cacf87cadb6557405c".toString('hex'));
      console.log('Send signed tx...')
      const result = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);

      if (result.transactionHash) {
        console.log(`Successful Swap: https://rinkeby.etherscan.io/tx/${result.transactionHash}`)
      }

    while(1){
        tx = await contranct_instance.methods.swapExactTokensForETHUniswap(DAI_ADDRESS_RINKEBY)
        let gas_cost2 = await web3.eth.estimateGas({
            from: "0x570dC83f03fc09e65Cb7D61Ccc4559f01C9D6063",
            to: CONTRACT_ADDRESS,
            data: tx.encodeABI()
        })
        // console.log(`gas_cost: ${gas_cost}`)
        const tx_cost = web3.utils.toBN(web3.utils.toWei('20', 'Gwei')).mul(web3.utils.toBN(gas_cost1).add(web3.utils.toBN(gas_cost2)))
        console.log(`tx_cost: ${tx_cost} -> ${web3.utils.fromWei(tx_cost.toString())}`)
        let tokenAmount2 = await exchangeContract.methods.getAmountsOut(tokenAmount1[1], [DAI_ADDRESS_RINKEBY, WETH_ADDRESS]).call()    
        console.log(`output ETH amount: ${tokenAmount2[1]} -> ${web3.utils.fromWei(tokenAmount2[1].toString())}`)
        
        const swap_fee = web3.utils.toBN(web3.utils.toWei("0.012", "ether"))
        console.log(`swap_fee: ${swap_fee} -> ${web3.utils.fromWei(swap_fee.toString())}`)

        let profit = web3.utils.toBN(tokenAmount2[1].toString()).sub(web3.utils.toBN(web3.utils.toWei("2", "ether"))).sub(tx_cost).sub(swap_fee)
        console.log(`profit: ${profit}`)
        if (profit > 0) {
            console.log(`profit : ${web3.utils.fromWei(profit)} ETH`)
            
            let txData = {
                // nonce: web3.utils.toHex(tx_nonce),
                gasLimit: web3.utils.toHex(600000),
                gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'Gwei')), // 10 Gwei
                to: CONTRACT_ADDRESS,
                from: "0x570dC83f03fc09e65Cb7D61Ccc4559f01C9D6063",
                data: tx.encodeABI()
            }

            const signedTx = await web3.eth.accounts.signTransaction(txData, "0x" + "2d25dcf11d253452d1def8ac93ac6da7a1d06b41536a15cacf87cadb6557405c".toString('hex'));
            console.log('Send signed tx...')
            const result = await web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
      
            if (result.transactionHash) {
              console.log(`Successful Swap: https://rinkeby.etherscan.io/tx/${result.transactionHash}`)
            }

            web3.eth.getBalance(CONTRACT_ADDRESS).then(result => {
                console.log(`contract account balance : ${web3.utils.fromWei(result)}`)
            })

            return

        }
    }

})();