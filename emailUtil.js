/*
 * @Descripttion: 
 * @version: 
 * @Author: huhuimao
 * @Date: 2021-01-21 19:05:14
 * @LastEditors: huhuimao
 * @LastEditTime: 2021-01-25 17:41:22
 */
'use strict';

const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  // host: 'smtp.qq.email',
  service: 'qq', // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
  port: 465, // SMTP 端口
  // secureConnection: true, // 使用了 SSL
  auth: {
    user: '262580913@qq.com',//你的邮箱
    // 这里密码不是qq密码，是你设置的smtp授权码
    pass: process.env.QQ_MAIL_PWD
  }
});





async function SendEmail(email_info) {
    let mailOptions = {
    from: '"DeFi Front Running Bot" <262580913@qq.com>', // sender address
    to: 'tiandiyi8888@163.com', // list of receivers
    subject: 'Front Running Bot', // Subject line
    // 发送text或者html格式
    // text: 'Hello 我是火星黑洞', // plain text body
    html: '<b>Big Tx Found</b>' + '<br><span>' +email_info + '</span>'// html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error)
        return 
      }
      console.log('Message sent: %s', info.messageId);
      // Message sent: <04ec7731-cc68-1ef6-303c-61b0f796b78f@qq.com>
    });

}

// SendEmail('Arb opportunity found Kyber -> Uniswap!')

exports.SendEmail = SendEmail;