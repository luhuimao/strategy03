/*引入mysql模块*/

const mysql = require('mysql');
const sd = require('silly-datetime');

 

/*创建连接*/



var pool = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "123456",
    database: "strategy_db"
})

const connection = mysql.createConnection({
    host: 'localhost',

    user: 'root',

    password: '123456',
    database : 'strategy_db'


});

 

/*连接mysql*/

/*connection.connect(function (err) {

    if (err) {
        console.error('error connecting: ' + err.stack);

        return;

    }

    console.log('connected as id ' + connection.threadId);

});*/

/*关闭连接mysql*/

//connection.end();

async function getWeeklyProfit() {
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query(
            'SELECT num_of_profit FROM trading_records where DATE_SUB(CURDATE(), INTERVAL 7 DAY) <= date(order_open_time)',
            (error, results) => {
                if (error) throw error;
                var weeklyProfits = 0;
                for(i = 0; i < results.length; i++){
                    //console.log(results[i]['num_of_profit'])
                    weeklyProfits += results[i]['num_of_profit']
                }
                console.log('=========================================================================================================================')
                console.log(`本周累计获利： ${weeklyProfits.toString()} ETH`)
                console.log('=========================================================================================================================')
                console.log('\n')
                connection.release();
          }
        );
      });
}

exports.getWeeklyProfit = getWeeklyProfit;

async function getTodayProfit() {
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query(
            'select num_of_profit from trading_records where to_days(order_open_time) = to_days(now())',
            (error, results) => {
                if (error) throw error;
                var todayProfits = 0;
                for(i = 0; i < results.length; i++){
                    //console.log(results[i]['num_of_profit'])
                    todayProfits += results[i]['num_of_profit']
                }
                console.log('=========================================================================================================================')
                console.log(`本日累计获利： ${todayProfits.toString()} ETH`)
                console.log('=========================================================================================================================')
                console.log('\n')
                connection.release();
          }
        );
      });

}

exports.getTodayProfit = getTodayProfit;

async function insertToTradingRecords(txHash, ethAmount, txFees, profitAmount){
    // console.log('=========================================================================================================================')
    // console.log('Insert Into trading_records(transaction_hash,num_of_eth,transaction_fees,num_of_profit, order_open_time) values("' + txHash + '","' + ethAmount + '","' + txFees + '","' + profitAmount + '","' + sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss') + '")')
    // console.log('=========================================================================================================================')
    // console.log('\n')

    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query(
            'insert into trading_records(transaction_hash,num_of_eth,transaction_fees,num_of_profit, order_open_time) values("' + txHash + '","' + ethAmount + '","' + txFees + '","' + profitAmount + '","' + sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss') + '")',
            (error, results) => {
                if (error) throw error;
                console.log('=========================================================================================================================')
                console.log(`Insert Table succeed`);
                console.log('=========================================================================================================================')
                console.log('\n')
                connection.release();
          }
        );
      });
      

}

exports.insertToTradingRecords = insertToTradingRecords;