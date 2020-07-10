//main 부분
var express = require('express');
var router = express.Router();
const config = require('../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

const queryExec = (sql, v) => new Promise ((resolve, reject) => {
    connection.query(sql, v, function (err, res) {
    if (err) {
        reject(err) 
    } else {
        resolve(res) // reject는 예외 처리를 할 때 사용합니다.
    }
    })
});

router.get('/', function(req, res) {
    res.redirect("http://autoinspec.com");
    //res.redirect("https://autoinspec.com");
});


//순서 변경..
router.post('/modOrder', function(req, res) {

    var arr = req.body.arr;
    var query = [];
    var sql = "UPDATE " + req.body.tableName + " SET order_ = ? WHERE id = ?";

    for (var i=0; i<arr.length; i++) {
         query.push(queryExec(sql, [i+1, parseInt(arr[i])]));
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
});

//삭제 플래그 변경
router.post('/modDelYN/:id', function(req, res) {

    var jsonData = req.body;

    var sql = "UPDATE " + req.body.tableName + " SET delYN = 'Y' WHERE id = " + req.params.id;
    
    connection.query(sql, jsonData['delYN'], (err) => {   
        if (err) {   
            console.log(err);
        } else {
            res.send("success");
        }
    });
});

//삭제
router.post('/del/:id', function(req, res) {

    var jsonData = req.body;

    var sql = "DELETE FROM  " + req.body.tableName + " WHERE id = " + req.params.id;
    
    connection.query(sql, (err) => {   
        if (err) {   
            console.log(err);
        } else {
            res.send("success");
        }
    });
});

//모듈에 등록해야 web.js에서 app.use 함수를 통해서 사용 가능
module.exports = router;