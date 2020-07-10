const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

var format = 'YYYY-MM-DD HH:mm:ss';
var moment = require('moment');
require('moment-timezone');

const queryExec = (sql, v) => new Promise ((resolve, reject) => {
    connection.query(sql, v, function (err, res) {
    if (err) {
        reject(err) 
    } else {
        resolve(res) // reject는 예외 처리를 할 때 사용합니다.
    }
    })
});

//리스트
exports.ratingItem = (req, res) => {

    var type = (req.params.type == null) ? 1: parseInt(req.params.type)

    let model = {};
    
    connection.query('SELECT id, name, subname, contents, color, order_, useYN, createdAt FROM rating WHERE type = ? AND delYN = "N" ORDER BY order_ ;', [type] , (err,rs) => {   
        if(err){   
            console.log(err);
            res.end();
        }else{
            model.list = rs;
            res.render('admin/code/rating/list', {model:model, type: type, userObj: req.cookies.userObj});
        }
    });
};

/** 등록폼 */
exports.addForm = (req, res) => {
    res.render('admin/code/rating/add', {type: req.params.type, userObj: req.cookies.userObj});
};

// subscription item 등록 POST
exports.add = (req, res) => {

    var jsonData = req.body;
    console.log(jsonData)

    var order = 1;

    var sql = 'SELECT * FROM rating WHERE useYN = "Y" ORDER BY order_ DESC limit 1';	
    connection.query(sql, function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            if (results.length == 1) {
                order = results[0].order_ + 1;
            } 

                sql = 'INSERT INTO rating(type, name, subname, contents, color, order_, createdAt)VALUES(?, ?, ?, ?, ?, ?, ?)';

                var params = [ req.params.type, jsonData['name'], jsonData['subname'], jsonData['contents'], jsonData['color'], order, moment.utc().format(format)];
                connection.query(sql,params,function(err,rows,fields) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.status(200).json({ 'msg': "success" });
                    }
                });
            }    
    });      
};

// main modForm GET
exports.modForm = (req, res) => {

    connection.query('SELECT id, name, subname, contents, color, useYN FROM rating WHERE id=' + req.params.id, (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("admin/code/rating/mod",{data:rs, type: req.params.type, userObj: req.cookies.userObj});
        }
    });
};


// modForm GET
exports.mod = (req, res) => {

    var jsonData = req.body;
    console.log(jsonData)
    
    var obj = { name: jsonData['name'], subname: jsonData['subname'], contents: jsonData['contents'], color: jsonData['color'], useYN: jsonData['useYN'] };

    connection.query('UPDATE rating SET ? WHERE id = ' + req.params.id, [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.status(400).json({ 'msg': "error" });
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};