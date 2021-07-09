const config = require('../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../public/js/common');
const header_mail = require('../../public/js/mail_template/header');
const footer_mail = require('../../public/js/mail_template/footer');
const content_html = require('../../public/js/mail_template/new_qna_content');

var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';

//메일 관련
var nodemailer = require('nodemailer');
var smtpTransporter = require('nodemailer-smtp-transport');

//메일 서버
var smtpTransport = nodemailer.createTransport(smtpTransporter({
    service: 'Lineworks',
    host:'smtp.worksmobile.com',
    secure: true,
    port:'465',
    tls: {
        rejectUnauthorized: false,
        ignoreTLS: false,
        requireTLS: true,
        secureProtocol: "TLSv1_method"
    },
    auth:{
        user:'service@autoingroup.com',
        pass:'autoin2020$',
    }
}));


// about GET
exports.about = (req, res) => {

    connection.query('SELECT video_url, title, sub_title, contents, file_name_org, file_name_new, size FROM homepage WHERE type = 2;', (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("info/about",{data: rs[0], userObj: req.cookies.userObj});
        }
    });
};


exports.help = (req, res) => {
    connection.query('SELECT id, title, contents, order_, createdAt, useYN FROM homepage WHERE useYN = "Y" AND type = 4 ORDER BY order_', (err,rs) => {   

        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("info/help",{list: rs, userObj: req.cookies.userObj});
        }

    });
};

exports.qnaForm = (req, res) => {

    var year = new Date().getFullYear();		// 현재 월 변수에 저장
    var month = new Date().getMonth() + 1;		// 현재 월 변수에 저장

    common.createYearFolder('qna', year);
    common.createMonthFolder('qna', year, month);

    res.render("info/qna",{ path: 'qna/' + year + '/' + month + '/', userObj: req.cookies.userObj});
};

exports.qnaAdd = (req, res) => {

    var contents = req.body.contents;
    contents = contents.replace(/\n/g, "<br>");
  
    var sql = 'INSERT INTO qna(userId, email, type, companyId, title, contents, createdAt, path, filename)VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
    var params = [ req.cookies.userObj.id, req.body.email, req.body.type, req.body.companyId, req.body.title, contents, moment.utc().format(format)];
    if (req.file != undefined) {
        params.push(req.body.path);
        params.push(req.file.filename)
    } else {
        params.push('');
        params.push('');
    }
    connection.query(sql,params,function(err, rows, fields) {
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });

    //새로운 질문이 등록되었을 때 알림 메일 전송
    //메일 옵션
    var mailOpt = {
        from: 'service@autoinspec.com',
        to: 'service@autoingroup.com',
        subject: '[AUTOINSPEC] Q&A가 등록되었습니다.',
        html: header_mail.getData(req.protocol + '://' + req.headers.host) + content_html.getData(req.protocol + '://' + req.headers.host, req.body.email, req.body.type, req.body.companyId, req.body.title, req.body.contents)
            + footer_mail.getData(req.protocol + '://' + req.headers.host)
    };

    //메일 전송
    smtpTransport.sendMail(mailOpt, function(err, res) {
    if (err) {
        console.log(err);
    } 
    smtpTransport.close();
    });
};
  
