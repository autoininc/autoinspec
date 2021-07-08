const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const fs = require("fs"); // 파일시스템 접근을 위한 모듈 호출

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

// 순서 변경
exports.modOrder = (req, res) => {
    
    var arr = req.body.arr;
    var query = [];

    for (var i=0; i<arr.length; i++) {
         query.push(queryExec("UPDATE homepage SET order_ = ? WHERE id = ?", [i+1, parseInt(arr[i])]));
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

//사용여부 옵션 변경
exports.modUseOption = (req, res) => {

    var jsonData = req.body;
    
    connection.query('UPDATE homepage SET useYN = ? WHERE id = ' + req.params.id, jsonData['useYN'], (err) => {   
        if (err) {   
            console.log(err);
        } else {
            res.send("success");
        }
    });
};


// 삭제
exports.delItem = (req, res) => {
    
    var jsonData = req.body;
    
    console.log(req.params.id);
    connection.query('DELETE FROM homepage WHERE id = ' + req.params.id, (err) => {   
        if (err) {   
            console.log(err);
        } else {
            
            //파일 삭제
            //var filePath = "./upload/homepage/" + jsonData['file_name']; // 삭제할 파일의 위치​

            if (jsonData['file_name'] != '') {
                var filePath = "/home/hosting_users/autoinspec/apps/autoinspec_autoinspec/public/uploads/" + jsonData['file_name']; // 삭제할 파일의 위치​

                fs.unlink(filePath, function(err){ // fs 모듈을 이용해서 파일 삭제합니다.​
    
                    if(err) res.send(err); // 에러 확인
                    
                });
            } else {
                res.status(200).json({ 'msg': "success" });
            }
        }
    });
};

// main GET
exports.main = (req, res) => {
    let model = {};

    connection.query('SELECT id, title, title_size, title_color, contents, contents_size, contents_color, file_name_org, file_name_new, size, order_, useYN FROM homepage WHERE type = 1 ORDER BY order_', (err,rs) => {   
        if (err) {   
            console.log(err);
        } else {
            model.list = rs;
            res.render("admin/homepage/main/list", {model:model, userObj: req.cookies.userObj});
        }
    });
};

// main 등록폼 GET
exports.main_addForm = (req, res) => {
    res.render("admin/homepage/main/add",{userObj: req.cookies.userObj});
};

// main 등록
exports.main_add = (req, res) => {

    if (req.body.title == '') {
        res.status(400).json({ err: '제목을 입력해 주세요!' });
    }
    if (req.body.contents == '') {
        res.status(400).json({ err: '내용을 입력해 주세요!' });
    }
    if (req.file == undefined) {
        res.status(400).json({ err: '파일을 업로드해 주세요!' });
    }

    var order = 1;
    var sql = 'SELECT * FROM homepage WHERE type = 1 ORDER BY order_ DESC limit 1';	
    connection.query(sql, function(err,results) {

        if (err) {
            console.log(err);
        } else {

            if (results.length == 1) {
                order = results[0].order_ + 1;
            }

            sql = 'INSERT INTO homepage(type, title, title_size, title_color, contents, contents_size, contents_color, file_name_org, file_name_new, size, order_, createdAt, create_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            var params = [1, req.body.title, req.body.title_size, req.body.title_color, req.body.contents, req.body.contents_size, req.body.contents_color,
                req.file.originalname, req.file.filename, req.file.size, order, moment.utc().format(format), req.cookies.userObj.id];

            connection.query(sql, params, function(err) {
                
                if (err) {
                    console.log(err);
                } else {
                    res.send("success");
                }
            });
            
        }
    });
    
};

// main modForm GET
exports.main_modForm = (req, res) => {

    connection.query('SELECT id, title, title_size, title_color, contents, contents_size, contents_color, file_name_org, file_name_new, size, order_, useYN FROM homepage WHERE id=' + req.params.id, (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("admin/homepage/main/mod",{data:rs, userObj: req.cookies.userObj});
        }
    });
};

// main modForm GET
exports.main_mod = (req, res) => {

    var obj = { title: req.body.title, title_size: req.body.title_size, title_color: req.body.title_color, contents: req.body.contents, contents_size: req.body.contents_size, contents_color: req.body.contents_color, 
                    updatedAt: moment.utc().format(format), update_id: req.cookies.userObj.id };

    if (req.file != undefined) {
        obj.file_name_org = req.file.originalname;
        obj.file_name_new = req.file.filename;
        obj.size = req.file.size;
    }

    connection.query('UPDATE homepage SET ? WHERE id = ' + req.params.id, [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.send("success");
        }
    });
};

// about GET
exports.about = (req, res) => {

    let model = {};
    connection.query('SELECT video_url, title, sub_title, contents, file_name_org, file_name_new, size FROM homepage WHERE type = 2;', (err,rs) => { 

        if (err) {   
            console.log(err);
            res.end();
        } else {
            model.data = rs;
            res.render("admin/homepage/about", {model: model, userObj: req.cookies.userObj});
        }

    });
};

exports.about_mod = (req, res,) => {

    var obj = { title: req.body.title, sub_title: req.body.sub_title, video_url: req.body.video_url, contents: req.body.contents, updatedAt: moment.utc().format(format), update_id: req.cookies.userObj.id };

    if (req.file != undefined) {
        obj.file_name_org = req.file.originalname;
        obj.file_name_new = req.file.filename;
        obj.size = req.file.size;
    }

    connection.query('UPDATE homepage SET ? WHERE type = 2', [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.send("success");
        }
    });
};

// service GET
exports.service = (req, res) => {
    
    let model = {};

    connection.query('SELECT id, title, file_name_org, file_name_new, size, order_, createdAt, useYN FROM homepage WHERE type = 3 ORDER BY order_', (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            model.list = rs;
            res.render("admin/homepage/service/list", {model:model , userObj: req.cookies.userObj});
        }
    });
};

// service addForm GET
exports.service_addForm = (req, res) => {
    res.render("admin/homepage/service/add", {userObj: req.cookies.userObj});
};


exports.service_add = (req, res) => {

    if (req.body.title == '') {
        res.status(400).json({ 'status': 400, 'msg': '제목을 입력해 주세요!' });
    }
    if (req.file == undefined) {
        res.status(400).json({ 'status': 400, 'msg': '파일을 업로드해 주세요!' });
    }

    var order = 1;
    var sql = 'SELECT * FROM homepage WHERE type = 3 ORDER BY order_ DESC limit 1';	
    connection.query(sql, function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            if (results.length == 1) {
                order = results[0].order_ + 1;
            }

            sql = 'INSERT INTO homepage(type, title, file_name_org, file_name_new, size, order_, createdAt, create_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?)';

            var params = [3, req.body.title, req.file.originalname, req.file.filename, req.file.size, order, moment.utc().format(format), req.cookies.userObj.id];
            
            connection.query(sql,params,function(err) {
                
                if (err) {
                    console.log(err);
                } else {
                    res.send("success");
                }
            });
        }
    });
    
};

// service modForm GET
exports.service_modForm = (req, res) => {

    connection.query('SELECT id, title, file_name_org, file_name_new, size, order_, createdAt, useYN FROM homepage WHERE id=' + req.params.id, (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("admin/homepage/service/mod",{data: rs, userObj: req.cookies.userObj});
        }
    });
};

// main modForm GET
exports.service_mod = (req, res) => {

    var obj = { title: req.body.title, updatedAt: moment.utc().format(format), update_id: req.cookies.userObj.id };

    if (req.file != undefined) {
        obj.file_name_org = req.file.originalname;
        obj.file_name_new = req.file.filename;
        obj.size = req.file.size;
    }

    connection.query('UPDATE homepage SET ? WHERE id = ' + req.params.id, [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.send("success");
        }
    });
};

// help GET
exports.help = (req, res) => {
    
    let model = {};

    connection.query('SELECT id, title, contents, order_, createdAt, useYN FROM homepage WHERE type = 4 ORDER BY order_', (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            model.list = rs;
            res.render("admin/homepage/help/list",{model:model, userObj: req.cookies.userObj});
        }
    });
};

// main addForm GET
exports.help_addForm = (req, res) => {
    res.render("admin/homepage/help/add", {userObj: req.cookies.userObj});
};


exports.help_add = (req, res) => {

    var jsonData = req.body;

    if (jsonData['title'] == '') {
        res.status(400).json({ 'status': 400, 'msg': '제목을 입력해 주세요!' });
    }
    if (jsonData['contents']  == '') {
        res.status(400).json({ 'status': 400, 'msg': '내용을 입력해 주세요!' });
    }

    var order = 1;
    var sql = 'SELECT * FROM homepage WHERE type = 4 ORDER BY order_ DESC limit 1';	
    connection.query(sql, function(err,results) {
        
        if (err) {
            console.log(err);
        } else {

            if (results.length == 1) {
                order = results[0].order_ + 1;
            }

            sql = 'INSERT INTO homepage(type, title, contents, order_, createdAt, create_id) VALUES(?, ?, ?, ?, ?, ?)';

            var params = [ 4, jsonData['title'] , jsonData['contents'], order, moment.utc().format(format), req.cookies.userObj.id];
            connection.query(sql,params,function(err) {
                
                if (err) {
                    console.log(err);
                } else {
                    res.json("success");
                }
            });
        }
    });
    
};

// main modForm GET
exports.help_modForm = (req, res) => {

    connection.query('SELECT id, title, contents, order_, createdAt FROM homepage WHERE id=' + req.params.id, (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("admin/homepage/help/mod",{data:rs, userObj: req.cookies.userObj});
        }
    });
};

// main modForm GET
exports.help_mod = (req, res) => {

    var jsonData = req.body;

    var obj = { title: jsonData['title'], contents: jsonData['contents'], updatedAt: moment.utc().format(format), update_id: req.cookies.userObj.id };

    connection.query('UPDATE homepage SET ? WHERE id=' + req.params.id, [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.json("success");
        }
    });
};
