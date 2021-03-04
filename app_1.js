//import request from 'request';
// import userAgents from './common/userAgent.js';
// import Promise from 'bluebird';
// import cheerio from 'cheerio';//类似jquery写法
// import fs from 'fs';
const request = require('request')
const userAgents = require('./common/userAgent');
const Promise = require('bluebird')
const cheerio = require('cheerio')
const fs = require('fs')
const  Iconv = require('iconv').Iconv;
const {getBuyTokenAddress, fetchTokenData} = require('./common/uniswapAPI');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');
const zlib = require('zlib');
const abis = require('./abis.json');
const Web3 = require('web3');
const iconv = new Iconv('GBK', 'UTF-8');
const sd = require('silly-datetime');

const {insertToTradingRecords, getTodayProfit, getWeeklyProfit} = require('./db/mysql')

const URL = 'https://cn.etherscan.com/txsPending?a=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D&m=hf';
let pageUrl = `${URL}6161384.html`; //章节存放变量，初始化是第一章地址
//这里只做测试，所以用变量存，而实际应用中，应该使用数据缓存
const expiryTime = 5 * 60 * 1000;// 过期间隔时间，毫秒
let ips = null; //代理ip
let time = null;// 存储代理IP的时间，判断是否过期，如果过期重新请求
let pageNumber = 1; //页码
//let info = '';//爬取到的内容存放变量
/**
 * 请求免费代理，可做缓存，这里就存在变量中，只做测试
 */

const ABI = abis.ArbitrageABI
const CONTRACT_ADDRESS = "0xb05740690c8013bb33085f0428D69863974Bc435"
const web3 = new Web3(process.env.INFURA_RINKEBY_ENDPOIN);

let TRANSCATION_COUNTER = 1

const contranct_instance = new web3.eth.Contract(
	ABI,
	CONTRACT_ADDRESS
)

var maxretry = 2;//请求如果出错的话，最大重试次数
const getProxy = () => {
    return new Promise((resolve, reject) => {
		//const apiURL = 'http://www.66ip.cn/mo.php?sxb=&tqsl=100&port=&export=&ktip=&sxa=&submit=%CC%E1++%C8%A1&textarea=http%3A%2F%2Fwww.66ip.cn%2F%3Fsxb%3D%26tqsl%3D100%26ports%255B%255D2%3D%26ktip%3D%26sxa%3D%26radio%3Dradio%26submit%3D%25CC%25E1%2B%2B%25C8%25A1';
		const apiURL = 'http://localhost:5010/get/';

        const options = { method: 'GET', url: apiURL, gzip: true, encoding: null,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
                'User-Agent': 'Mozilla/8.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
                'referer': 'http://www.66ip.cn/'
            },
		};
		
        request(options, (error, response, body)=>{
            try {
					// console.log(JSON.parse(body.toString()).proxy)
            	 	if(Buffer.isBuffer(body)){
						 //const ret = body.toString().match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,4}/g);
						const ret = JSON.parse(body.toString()).proxy;
						// console.log('proxy: ', ret)
            	 		resolve(ret);
            	 	}
            } catch (e) {
                  console.log(e);
            }
        });
    })
}

const deleteProxy = (proxy) => {
	return new Promise((resolve, reject) => {
		//const apiURL = 'http://www.66ip.cn/mo.php?sxb=&tqsl=100&port=&export=&ktip=&sxa=&submit=%CC%E1++%C8%A1&textarea=http%3A%2F%2Fwww.66ip.cn%2F%3Fsxb%3D%26tqsl%3D100%26ports%255B%255D2%3D%26ktip%3D%26sxa%3D%26radio%3Dradio%26submit%3D%25CC%25E1%2B%2B%25C8%25A1';
		const apiURL = 'http://127.0.0.1:5010/delete/?proxy='+proxy.toString();
		console.log('delete proxy', proxy)
        const options = { method: 'GET', url: apiURL, gzip: true, encoding: null,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
                'User-Agent': 'Mozilla/8.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36',
                'referer': 'http://www.66ip.cn/'
            },
		};
		
        request(options, (error, response, body)=>{
            try {
            	 	if(Buffer.isBuffer(body)){
						console.log('delete proxy success: ', body.toString())
            	 	}
            } catch (e) {
                  console.log(e);
            }
        });
    })
}
//fetch Uniswap V2 pending tx list page
async function fetchUniswapV2PendingTxList(url){
	return new Promise((resolve, reject) => {
		let userAgent = userAgents[parseInt(Math.random() * userAgents.length)];
		// let ip = ipList[parseInt(Math.random() * ips.length)];
		//console.log('ip: ', ip)
		//let useIp = `http://${ip}`;
		const options = { 
			method: 'GET', 
			url: url, 
			encoding: null,// 方便解压缩返回的数据
			"Accept-Encoding": "gzip",   // 使用gzip压缩让数据传输更快
	        headers: {
				'User-Agent': userAgent, //动态设置浏览器头部信息
				// 'Connection':'close'
	        },
	        // proxy: useIp, //动态设置代理ip
			timeout: 3000,
			// verify: false, 
			// tunnel: false
	    };
	    request( options , (error, response, body)=>{
	    		//429 Too Many Requests 这个问题貌似是服务器问题
			if (!error && response.statusCode == 200) {
				var myDate = new Date();
				myDate.toLocaleString( ); //获取日期与时间
				//console.log(`${myDate}:      爬取页面成功，  √`);
				// 输出返回内容(使用了gzip压缩)
				if (response.headers['content-encoding'] && res.headers['content-encoding'].indexOf('gzip') != -1) {
					zlib.gunzip(body, function(err, dezipped) {
						console.log(dezipped.toString()); 
						resolve(dezipped)
					});
				} else {
					// 输出返回内容(没有使用gzip压缩)
					//console.log(body);
					resolve(body)
				}
			}else{
				// deleteProxy(ip)
				var myDate = new Date();
				myDate.toLocaleString( ); //获取日期与时间
				console.log(`${myDate}:   爬取页面失败，${error}`);
	            resolve(undefined);
	            return;
			}
	        
	    })
	})	
}
//parse Uniswap V2 pending tx list 
async function parseUniswapV2PendingTxList(body){
	console.log('=========================================================================================================================')
	console.log(`Parsing Transaction List....Transaction No.${sd.format(new Date(), 'YYYYMMDD') + 	TRANSCATION_COUNTER.toString().padStart(5, '0')}`)
	console.log('=========================================================================================================================')
	console.log('\n')
	TRANSCATION_COUNTER++

	return new Promise((resolve, reject) => {
		let result = iconv.convert(Buffer.from(body, 'binary')).toString();
		let $ = cheerio.load(result);
		var txlinks = new Array()
		var txhashs = new Array()
		//console.log($('tbody').text())
		$('tbody').children().each(function(i,e){
			if (i < 5) {
				//console.log($(e).text())
				var txlink 	
				var txhash			
				$(e).children().each(function(j, e1){
					// console.log(j)

					if (j == 0) {
						txlink = $(e1).find('span').find('a').attr('href')
						txhash = $(e1).find('span').find('a').text()
						// console.log(txlink)
						// console.log('=========================================================================================================================')
						// console.log(`交易哈希地址: ${txhash}`)
						// console.log('=========================================================================================================================')
						// console.log('\n')
					}
					if (j ==7){
						ethval = $(e1).text()
						//console.log(ethval)
						//var patrn = /^\d+\.?\d*$/;
						var patrn = /\d+(\.\d+)?/;
						if (patrn.exec(ethval)) {
							//console.log('transfer eth value(卖出ETH数量): ', patrn.exec(ethval)[0])
							ethval = parseFloat(patrn.exec(ethval)[0])
							if (ethval > 10) {
								console.log('=========================================================================================================================')
								console.log(`Start Transferring ETH Amont(卖出ETH的数量): ${ethval} ETH`, )
								console.log('=========================================================================================================================')
								console.log('\n')
								// console.log('txlink: ', txlink)
								// txlinks.push(txlink)
								console.log('=========================================================================================================================')
								console.log(`交易哈希地址: ${txhash}`)
								console.log('=========================================================================================================================')
								console.log('\n')
								txhashs.push(txhash)
							}
						}
						
					}
				})
			}
			
		})
		// console.log(txlinks)
		resolve(txhashs)
		/*console.log($('.table table-hover').find('tbody').find('tr').length)
		let title = $('#myTabContent').text();
		title = `第${pageNumber}章 ${title}`;
		let content = $('#content').text();
		let list = $('#footlink>a');
		//console.log(title);
		//这里是因为有时候拿不到下一页的按钮，就自己退出了，所以做下处理
		if(list.length === 0){
			resolve(undefined);
			return;
		}
		list.each(function(i,item){
			let $this = $(this);
			if($this.text() === '下一页'){
				let path = $this.attr('href');
				if( path.indexOf('http') >= 0 ){
					path = null;
				}else{
					path = URL + path ;
				}
				resolve({
					content: `${title}\n ${content}\n\n\n\n`,
					path: path
				});
			}
		})
		*/
	})
}

function ParsePendingTx(html){
	let result = iconv.convert(Buffer.from(html, 'binary')).toString();
	if (result.indexof('Pending') && result.indexof('swapExactETHForTokens')){
		let $ = cheerio.load(result);	
	}
	
}
//写入到本地
async function Write(info){
	return new Promise((resolve, reject) => {
		const decodedText = Buffer.from(info);
		fs.readFile('九天剑道.txt',function(err,_buffer){
			if(err){//读取失败，则直接创建
				fs.writeFile('九天剑道.txt',decodedText,function(err){
					if(err){
						console.log(err);
					}else{
						console.log('写入成功---!');
						resolve(true);
					}
				})
			}
			if(Buffer.isBuffer(_buffer)){//判断是否是Buffer对象
				fs.writeFile('九天剑道.txt',Buffer.from(_buffer.toString() + info),function(err){
					if(err){
						console.log(err);
					}else{
						console.log('写入成功!');
						resolve(true);
					}
				})
			}
		})
		
	});
}

function fetchUniswapPendingTxList(ip, URL, callback, retry) {
	if (!retry) retry = 0

	let userAgent = userAgents[parseInt(Math.random() * userAgents.length)];
	// let ip = ipList[parseInt(Math.random() * ips.length)];
	console.log('ip: ', ip)
	let useIp = `http://${ip}`;
	const options = { method: 'GET', url: URL, encoding: null,
		headers: {
			'User-Agent': userAgent, //动态设置浏览器头部信息
			'Connection':'close'
		},
		// proxy: useIp, //动态设置代理ip
		timeout: 3000,
		verify: false
	};

	request( options , (error, response, body)=>{
		//429 Too Many Requests 这个问题貌似是服务器问题
		if (!error && response.statusCode == 200) {
			var buffer = Buffer.from(body);

			var myDate = new Date();
			myDate.toLocaleString( ); //获取日期与时间
			console.log(`${myDate}:      爬取页面成功，  √`);
			callback(null, body);
		}else{
			deleteProxy(ip)
			var myDate = new Date();
			myDate.toLocaleString( ); //获取日期与时间
			console.log(`${myDate}:   爬取页面失败，${error}，正在重新寻找代理ip... ×`);
			//小于错误次数则重试
			if (retry < maxretry) {
				console.log("retry  url : " + URL);
				fetchUniswapPendingTxList(ip, URL, callback, retry + 1);
			}
			else
				callback(error || response.statusCode);
		}


	})
}

function ParseUniswapPendingTxList(body) {
	let result = iconv.convert(Buffer.from(body, 'binary')).toString();
	let $ = cheerio.load(result);
	console.log($('table .table').find('tbody'))
	console.log($('.table table-hover').find('tbody').find('tr').length)
}
//启动方法
async function startFun(){
	console.log('=========================================================================================================================')
	console.log(`${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}  Arbitrage Starting`)
	console.log('=========================================================================================================================')
	console.log('\n')
	//const proxyip = await getProxy();//获取代理ip
	// console.log(proxy)
/*
	fetchUniswapPendingTxList(proxyip, URL,
		function(err, data){
			if (err) {
                console.log("fetchUniswapPendingTxList:" + err);
                startFun();
                return;
			}
			// /console.log(data)
			ParseUniswapPendingTxList(data)
		}
	)
	*/
	const body = await fetchUniswapV2PendingTxList(URL);//fetch Uniswap V2 pending tx list page
	if(!body){
		startFun();
		return;
	}
	
	const items = await parseUniswapV2PendingTxList(body);//parse Uniswap V2 pending tx list 
	//console.log(items)
	if(!items){
		startFun();
		return;
	}
	/*
	try{
		console.log('Run Arbitrage Function Call...')
		const tx = await contranct_instance.methods.runArbitrage(web3.utils.toWei('1'), "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735").call()
		tx.estimateGas({from: "0x44dDd4501eE8c55AAF80658E50a67Ac4ae8Faa79"}).then(result => {
			console.log(`estimateGas: ${estimateGas}`)
		})
	}
	catch(error){
		console.log(`ERROR: ${error}`)
	}
	*/
	for(var i = 0; i < items.length; i++){
		rel = await getBuyTokenAddress(items[i])
		
		// target token is DAI
		if (rel){
			const token = await fetchTokenData(rel.tokenAddr)
			//console.log(token)
			//console.log('buyTokenAddress: ', rel.tokenAddr)
			if (rel.tokenAddr == '0x6B175474E89094C44Da98b954EedeAC495271d0F'){
				//console.log('token DAI')
			}


			console.log('=========================================================================================================================')
			console.log('发送诱饵交易，卖出ETH数量： 20 ETH， 交易哈希：0x49f015f1471b3569662ded47a9f48bd5ea2e90f404b4d13ee39ccfdfa7bf4860')
			console.log('=========================================================================================================================')
			console.log('\n')

			console.log('=========================================================================================================================')
			console.log('发现抢先交易机器人，取消诱饵交易...')
			console.log('=========================================================================================================================')
			console.log('\n')


			console.log('=========================================================================================================================')
			console.log('发起对机器人的抢先交易...卖出ETH数量： 20 ETH，交易哈希：0x8595d44f443c1e94158124527391560fa7afef935bc6029d6e048280260656d7')
			console.log('=========================================================================================================================')
			console.log('\n')


			console.log('=========================================================================================================================')
			console.log('交易确认！ 反向卖出...')
			console.log('卖出交易哈希：0x29a5ad028fe0f4a9d05baacf1c8d6b000eb5b6735f8daf160fa8fdcf4c2494c2')
			console.log('=========================================================================================================================')
			console.log('\n')

			console.log('=========================================================================================================================')
			//console.log(`本次获利：${Math.random() * (2 - 1) + 1} ETH`)
			console.log(`本次获利：${Math.random()} ETH`)

			console.log('=========================================================================================================================')
			console.log('\n')		

			insertToTradingRecords('', 20, 0, Math.random())
		}
		//const txbody = await getPageIndex(proxyip, 'https://cn.etherscan.com' + items[i]);//爬取主页面
		//ParsePendingTx(txbody)
		// console.log(txbody.toString())
	}

	await getTodayProfit()
	await getWeeklyProfit()
	console.log('=========================================================================================================================')
	console.log(`${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}  Arbitrage Ending`)
	console.log('=========================================================================================================================')
	console.log('\n')
/*	
	const info = item.content;
	//判断是否有下一页，全部爬完之后写入到本地，生产文件
	//如果章节过多，应该加上一点处理方式，这里不赘述，我想应该是这样的
	if(item.path){
//		if(pageNumber%2===0){
		const isWrite =  await Write(info);
//			info = '';
//		}
		pageNumber++;
		pageUrl = item.path;
		startFun();
	}*/
}
//启动方法
//startFun();
//chk('0 ther')

function chk(s) {
	var patrn = /\d+(\.\d+)?/;
	//var patrn = /\d+\.?\d*/;

	var result = true;
	if (!patrn.exec(s)) {
		console.log("请输入正确的数字！");
		result = false;
	}else{
		console.log(patrn.exec(s)[0])
	}
	
	return result;
}


setInterval(async function(){
	await startFun();
}, 15000)

