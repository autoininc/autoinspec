const config = require('../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../public/js/common');

var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';

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

//autoinmap
exports.service = (req, res) => {
    let model = {};
    var countries_result;
    connection.query('SELECT a.id, a.country_name, a.code, COUNT(b.id) as count FROM countries a LEFT OUTER JOIN company b ON a.id = b.country_id WHERE a.showYN = "Y"  GROUP BY a.id ORDER BY id DESC; ',
        (err,result) => {
        if (err) {   
            console.log(err);
            res.end();
        } else {
            countries_result = result;
            model.countries = countries_result;
            res.render("info/service",{model: model, userObj: req.cookies.userObj});
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
};
  
