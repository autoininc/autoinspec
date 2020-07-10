const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

//시간 관련
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

    connection.query('SELECT id, code, useYN, order_, createdAt FROM certification ORDER BY order_ ASC', (err, rs) => {  

        if(err) {   
            console.log(err);
            res.end();
        } else {
            model.list = rs;
            res.render('admin/code/certification/list', {model:model , userObj: req.cookies.userObj});
        }
    });
};

//등록
exports.add = (req, res) => {

    var jsonData = req.body;
    
    if (jsonData['code'] == '') {
        res.status(400).json({ 'status': 400, 'msg': '코드명을 입력해 주세요!' });
    }

    var order = 1;

    //중복 체크
    var sql = 'SELECT * FROM certification WHERE code = ?';	
    connection.query(sql, jsonData['code'], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            if (results.length == 1) {
                res.status(400).json({ 'status': 400, 'msg': '이미 등록된 코드명입니다.' });
            } else{
                //순서 값 생성
                var sql = 'SELECT * FROM certification WHERE useYN = "Y" ORDER BY order_ DESC limit 1';	
                connection.query(sql, function(err,results) {
                    
                    if (err) {
                        console.log(err);
                    } else {
                        if (results.length == 1) {
                            order = results[0].order_ + 1;
                        }
                        //등록
                        sql = 'INSERT INTO certification(code, order_, createdAt)VALUES(?, ?, ?)';

                        var params = [jsonData['code'], order, moment.utc().format(format)];
                        connection.query(sql,params,function(err,rows,fields) {
                            if (err) {
                                console.log(err);
                            } else {
                                res.status(200).json({ 'msg': "success" });
                            }
                        });
                    }
                });
            }
        }
    });
};

exports.getData = (req, res) => {

    var jsonData = req.body;
    var id = jsonData['id'];
    
    var sql = 'SELECT * FROM certification WHERE id = ?';	
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
    
    var sql = 'UPDATE certification SET code = ? WHERE id = ?';	
    connection.query(sql, [jsonData['code'], jsonData['id']], function(err, results) {
        
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    
    });
};

exports.modOrder = (req, res) => {
    
    var arr = req.body.arr;
    var query = [];

    for (var i=0; i<arr.length; i++) {
         query.push(queryExec("UPDATE certification SET order_ = ? WHERE id = ?", [i+1, parseInt(arr[i])]));
    }
    (async () => {
        try {
        Promise
            .all(query)
            .then(values => {
                res.json({ msg: '완료되었습니다.'});
            })
        } catch (err) {
            res.status(400).json({ 'status': 400, 'msg': '오류로 중지되었습니다.' });
        }
    })()
};

exports.modUseOption = (req, res) => {
    
    var jsonData = req.body;
    var useYN = jsonData['useYN'];
    var obj = {};
    obj['useYN'] = useYN;
    
    var sql = 'UPDATE certification SET ? WHERE id = ?';	
    connection.query(sql, [obj, jsonData['id']], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};

// 삭제
exports.delItem = (req, res) => {
    
    connection.query('DELETE FROM certification WHERE id = ' + req.params.id, (err) => {   
        if (err) {   
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};