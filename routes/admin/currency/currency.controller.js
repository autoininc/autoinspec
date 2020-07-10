const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';

const queryExec = (sql, v) => new Promise ((resolve, reject) => {
    connection.query(sql, v, function (err, res) {
    if (err) {
        reject(err) 
    } else {
        resolve(res) // reject는 예외 처리를 할 때 사용합니다.
    }
    })
});

// 목록 GET
exports.list = (req, res) => {

    let model = {};
    
    connection.query('SELECT id, title, code, value, defaultYN, updatedAt FROM currencies', (err, rs) => {   

        if(err){   
            console.log(err);
            res.end();
        } else {

            model.list = rs;
            res.render('admin/code/currency/list', {model:model, userObj: req.cookies.userObj, moment: moment});
        }
    });
};

/** 등록폼 */
exports.addForm = (req, res) => {
  res.render('admin/code/currency/add', {userObj: req.cookies.userObj});
};

/** 등록 */
exports.add = (req, res) => {
    
    var jsonData = req.body;
    var sql = 'INSERT INTO currencies (title, code, symbolNative, decimalPlaces, value, unit, useYN, updatedAt, update_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)';
    var params = [jsonData['title'], jsonData['code'], jsonData['symbolNative'], jsonData['decimalPlaces'], jsonData['value'], jsonData['unit'], jsonData['useYN'], moment.utc().format(format), req.cookies.userObj.id];
    connection.query(sql, params, function(err, rows, fields){
        if(err){
            console.log(err);
        } else {
            console.log(rows.insertId);
            res.json({ 'msg': '등록이 완료되었습니다!' });
        }
    });
};

// modForm GET
exports.modForm = (req, res) => {

    connection.query('SELECT id, title, code, symbolNative, decimalPlaces, value, unit, useYN FROM currencies WHERE id=' + req.params.id, (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("admin/code/currency/mod",{data:rs, userObj: req.cookies.userObj});
        }
    });
};

// modForm GET
exports.mod = (req, res) => {

    var jsonData = req.body;
    console.log(jsonData)
    
    var obj = { title: jsonData['title'], code: jsonData['code'], symbolNative: jsonData['symbolNative'], decimalPlaces: jsonData['decimalPlaces'], value: jsonData['value'], unit: jsonData['unit'], 
                useYN: jsonData['useYN'], updatedAt: moment.utc().format(format), update_id: req.cookies.userObj.id };

    connection.query('UPDATE currencies SET ? WHERE id = ' + req.params.id, [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.status(400).json({ 'msg': "error" });
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};

//default 변경
exports.modDefault = (req, res) => {
    
    var jsonData = req.body;
    
    var sql = 'UPDATE currencies SET defaultYN = "Y" WHERE id = ?';	
    connection.query(sql, jsonData['id'], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {

            var sql_ = 'UPDATE currencies SET defaultYN = "N" WHERE id != ?';	
            connection.query(sql_, jsonData['id'], function(err,results) {
        
                if (err) {
                    console.log(err);
                } else {
                    res.status(200).json({ 'msg': "success" });
                }
            });
        }
    });
};

// 삭제
exports.delItem = (req, res) => {
    
    connection.query('DELETE FROM currencies WHERE id = ' + req.params.id, (err) => {   
        if (err) {   
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};
