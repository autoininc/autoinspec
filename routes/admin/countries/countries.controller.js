const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../../public/js/common');

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// 목록 GET
exports.list = (req, res) => {

    let model = {};

    //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
    connection.query('SELECT a.id, a.country_name, a.code, a.showYN, a.detailYN, COUNT(b.id) as cnt FROM countries a LEFT JOIN company b ON a.id = b.country_id GROUP BY a.id' ,(err,rs)=>{   
        if(err){   
            console.log(err);
            res.end();
        }else{
            model.list = rs;
            res.render('admin/code/countries/list', {model:model, comma: common.comma, userObj: req.cookies.userObj});
        }
    });
};

exports.add = (req, res) => {

    var jsonData = req.body;
    if (jsonData['name'] == '') {
        res.status(400).json({ 'status': 400, 'msg': '나라명을 입력해 주세요!' });
    }
    if (jsonData['code'] == '') {
        res.status(400).json({ 'status': 400, 'msg': '코드명을 입력해 주세요!' });
    }

    var sql = 'SELECT * FROM countries WHERE country_name= ?';	
    connection.query(sql, [jsonData['name']], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            if (results.length == 1) {
                res.status(400).json({ 'status': 400, 'msg': '이미 등록된 나라명입니다.' });
            } else{

                sql = 'INSERT INTO countries(country_name, code)VALUES(?, ?)';

                var params = [jsonData['name'], jsonData['code']];

                connection.query(sql,params,function(err,rows,fields) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.status(200).json({ 'status': 200, 'msg': "success" });
                    }
                });
            }
            
        }
    });
    
};

exports.getData = (req, res) => {

    var jsonData = req.body;
    var id = jsonData['id'];
    
    var sql = 'SELECT * FROM countries WHERE id = ?';	
    connection.query(sql, [id], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ 'data': results[0] });
        }
    
    });
};

exports.modify = (req, res) => {

    var jsonData = req.body;
    
    var sql = 'UPDATE countries SET country_name = ?, code = ? WHERE id = ?';	
    connection.query(sql, [jsonData['name'], jsonData['code'], jsonData['id']], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    
    });
};

exports.modOption = (req, res) => {

    var jsonData = req.body;
    var detailYN = jsonData['detailYN'];
    var showYN = jsonData['showYN'];
    var obj = {};

    if (showYN != undefined) {
        obj['showYN'] = showYN;
    }
    if (detailYN != undefined) {
        obj['detailYN'] = detailYN;
    }
    
    console.log(obj)
    var sql = 'UPDATE countries SET ? WHERE id = ?';	
    connection.query(sql, [obj, jsonData['id']], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    
    });
};
