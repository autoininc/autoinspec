const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

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
    
    //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
    connection.query('SELECT id, name_kor, name_eng, field_code, order_, useYN FROM field ORDER BY order_' ,(err,rs)=>{   
        if(err){   
            console.log(err);
            res.end();
        }else{
            model.list = rs;
            res.render('admin/code/field/list', {model:model, userObj: req.cookies.userObj});
        }
    });
};

exports.add = (req, res) => {

    var jsonData = req.body;
    
    if (jsonData['name'] == '') {
        res.status(400).json({ 'status': 400, 'msg': '필드명(한글)을 입력해 주세요!' });
    }
    if (jsonData['name_eng'] == '') {
        res.status(400).json({ 'status': 400, 'msg': '필드명(영어)을 입력해 주세요!' });
    }

    var order = 1;
    var sql = 'SELECT * FROM field WHERE name_kor = ? OR name_eng = ?';	
    connection.query(sql, [jsonData['name'], jsonData['name_eng']], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            if (results.length == 1) {
                res.status(400).json({ 'status': 400, 'msg': '이미 등록된 필드명(한글 or 영어)입니다.' });
            } else{

                var sql = 'SELECT * FROM field WHERE useYN = "Y" ORDER BY order_ DESC limit 1';	
                connection.query(sql, function(err,results) {
                    
                    if (err) {
                        console.log(err);
                    } else {
                        if (results.length == 1) {
                            order = results[0].order_ + 1;

                            sql = 'INSERT INTO field(name_kor, name_eng, field_code, order_)VALUES(?, ?, ?, ?)';

                            var params = [jsonData['name'], jsonData['name_eng'], jsonData['field_code'], order];
                            connection.query(sql,params,function(err,rows,fields) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    res.status(200).json({ 'msg': "success" });
                                }
                            });
                        }
                        
                    }
                });
               
            }
            
        }
    });
};

exports.getData = (req, res) => {

    var jsonData = req.body;
    var id = jsonData['id'];

    var sql = 'SELECT * FROM field WHERE id = ?';	
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
    
    var sql = 'UPDATE field SET name_kor = ?, name_eng = ? WHERE id = ?';	
    connection.query(sql, [jsonData['name'], jsonData['name_eng'], jsonData['id']], function(err,results) {
        
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
         query.push(queryExec("UPDATE field SET order_ = ? WHERE id = ?", [i+1, parseInt(arr[i])]));
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
    
    var sql = 'UPDATE field SET ? WHERE id = ?';	
    connection.query(sql, [obj, jsonData['id']], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    
    });
};