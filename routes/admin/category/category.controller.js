const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

// 목록 GET
exports.list = (req, res) => {

    var query_1st = req.query.query_1st || 0;
    var query_2nd = req.query.query_2nd || 0;
    var query_3rd = req.query.query_3rd || 0;
    var query_txt = req.query.query_txt || '';

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    var sql = "";
    sql += "SELECT COUNT(a.id) AS cnt" +
        " FROM category a LEFT OUTER JOIN category b ON a.parent_id = b.id LEFT OUTER JOIN category c ON b.parent_id = c.id" +
        " LEFT OUTER JOIN category d ON c.parent_id = d.id " + 
        " WHERE a.delYN ='N' AND a.category_name LIKE '%" + query_txt +"%'";

    if(query_1st != 0) {
        sql += ' AND (d.id =' + query_1st + ' OR c.id =' + query_1st + ' OR b.id =' + query_1st + ')';
    }
    if(query_2nd != 0) {
        sql += ' AND (c.id =' + query_2nd + ' OR b.id =' + query_2nd + ')';
    }
    if(query_3rd != 0) {
        sql += ' AND b.id =' + query_3rd;
    }
        
    connection.query(sql, (err,result) => {

        if(err) {
            console.log(err);
            res.end();
        } else {

            var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
            var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
            var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
            let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

            var sql2 = "";
            sql2 =" SELECT d.id AS p1_id, d.category_name AS p1_name, c.id AS p2_id, c.category_name AS p2_name, b.id AS p3_id, b.category_name AS p3_name, a.category_name AS category_name, a.id as id, a.depth as depth, a.useYN as useYN" +
                " FROM category a LEFT OUTER JOIN category b ON a.parent_id = b.id LEFT OUTER JOIN category c ON b.parent_id = c.id" +
                " LEFT OUTER JOIN category d ON c.parent_id = d.id " + 
                " WHERE a.delYN ='N' AND a.category_name LIKE '%" + query_txt +"%'";

            if(query_1st != 0) {
                sql2 += ' AND (d.id =' + query_1st + ' OR c.id =' + query_1st + ' OR b.id =' + query_1st + ')';
            }
            if(query_2nd != 0) {
                sql2 += ' AND (c.id =' + query_2nd + ' OR b.id =' + query_2nd + ')';
            }
            if(query_3rd != 0) {
                sql2 += ' AND b.id =' + query_3rd;
            }
            sql2 += ' LIMIT ?,?';

            connection.query(sql2, [skipSize, contentSize], (err,rs) => {   
                if(err){   
                    console.log(err);
                    res.end();
                } else {
                if (pnEnd > pnTotal) pnEnd = pnTotal; // NOTE: 페이지네이션의 끝 번호가 페이지네이션 전체 카운트보다 높을 경우.
                const result = {
                    totalCount,
                    pageNum,
                    pnStart,
                    pnEnd,
                    pnTotal,
                    contents: rs,
                };
                    res.render('admin/code/category/list',{model:result , userObj: req.cookies.userObj});
                }
            });
                
        }
    });
};

exports.getData = (req, res) => {

    var sql ="SELECT e.id AS p1_id, e.category_name AS p1_name, d.id AS p2_id, d.category_name AS p2_name, c.id AS p3_id, c.category_name AS p3_name, b.category_name AS category_name, b.id as id, b.depth as depth" +
        " FROM company_category a LEFT OUTER JOIN category b  ON a.category_id = b.id" +
        " LEFT OUTER JOIN category c ON b.parent_id = c.id" +
        " LEFT OUTER JOIN category d ON c.parent_id = d.id " + 
        " LEFT OUTER JOIN category e ON d.parent_id = e.id  WHERE a.id = ?";

    connection.query(sql, [req.params.id], (err,rs) => {   
        if(err){   
            console.log(err);
            res.end();
        } else {
            res.json({"data": rs});
        }
    });
};

exports.getlist = (req, res) => {

    var sql ="SELECT d.id AS p1_id, d.category_name AS p1_name, c.id AS p2_id, c.category_name AS p2_name, b.id AS p3_id, b.category_name AS p3_name, a.category_name AS category_name, a.id as id, a.depth as depth" +
        " FROM category a LEFT OUTER JOIN category b ON a.parent_id = b.id" +
        " LEFT OUTER JOIN category c ON b.parent_id = c.id" +
        " LEFT OUTER JOIN category d ON c.parent_id = d.id WHERE a.category_name LIKE '%" + req.body.query +"%' ";

    connection.query(sql, (err,rs) => {   
        if(err){   
            console.log(err);
            res.end();
        } else {
            res.json({"data": rs});
        }
    });
};

exports.get1stCategories = (req, res) => {

    connection.query('SELECT id, category_name, depth, parent_id, useYN, delYN FROM category WHERE depth = 1 ORDER BY id DESC' , (err,rs) => {   
        if(err) {   
            console.log(err);
            res.end();
        } else {
            res.json({ 'list': rs });
        }
    });
};

exports.get2ndCategories = (req, res) => {

    var jsonData = req.body;
    var sql = "SELECT id, category_name, depth, parent_id, useYN, delYN FROM category WHERE depth = 2 AND parent_id = ? ORDER BY id DESC";
    var params = [jsonData['parentId']];
    connection.query(sql, params ,(err,rs)=>{   
        if(err) {   
            console.log(err);
            res.end();
        } else {
            res.json({ 'list': rs });
        }
    });

};

exports.get3rdCategories = (req, res) => {

    var jsonData = req.body;
    var sql = "SELECT id, category_name, depth, parent_id, useYN, delYN FROM category WHERE depth = 3 AND parent_id = ? ORDER BY id DESC";
    var params = [jsonData['parentId']];
    connection.query(sql, params ,(err,rs)=>{   
        if(err) {   
            console.log(err);
            res.end();
        } else {
            res.json({ 'list': rs });

        }
    });
};


/** 등록폼 */
exports.addForm = (req, res) => {

    let model = {};
    connection.query('SELECT id, category_name, depth, parent_id, useYN, delYN FROM category WHERE depth = 1 ORDER BY id DESC' , (err,rs) => {   
        if(err) {   
            console.log(err);
            res.end();
        } else {
            model.list = rs;
            res.render('admin/code/category/add', {model:model, userObj: req.cookies.userObj});
        }
    });
};

/** 등록 */
exports.add = (req, res) => {
    
    var jsonData = req.body;
    var sql = 'INSERT INTO category (category_name, parent_id, depth) VALUES(?, ?, ?)';
    var params = [jsonData['name'], jsonData['parentId'], jsonData['depth']];
    connection.query(sql, params, function(err, rows, fields){
        if(err){
            console.log(err);
        } else {
            console.log(rows.insertId);
            res.json({ 'msg': '등록이 완료되었습니다!' });
        }
    });
};

exports.modOption = (req, res) => {

    var jsonData = req.body;
    var useYN = jsonData['useYN'];
    var obj = {};

    if (useYN != undefined) {
        obj['useYN'] = useYN;
    }
    
    var sql = 'UPDATE category SET ? WHERE id = ?';	
    connection.query(sql, [obj, jsonData['id']], function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    
    });
};

/** 수정폼 */
exports.modForm = (req, res) => {

    let model = {};
    connection.query('SELECT id, category_name, depth, parent_id, useYN, delYN FROM category WHERE depth = 1 ORDER BY id DESC' , (err,rs) => {   
        if(err) {   
            console.log(err);
            res.end();
        } else {
            model.list = rs;

            var sql ="SELECT e.id AS p1_id, e.category_name AS p1_name, d.id AS p2_id, d.category_name AS p2_name, c.id AS p3_id, c.category_name AS p3_name, b.category_name AS category_name, b.id as id, b.depth as depth" +
            " FROM category b LEFT OUTER JOIN category c ON b.parent_id = c.id" +
            " LEFT OUTER JOIN category d ON c.parent_id = d.id " + 
            " LEFT OUTER JOIN category e ON d.parent_id = e.id  WHERE b.id =" + req.params.id;
            connection.query(sql , (err, result) => {   
                if(err) {   
                    console.log(err);
                    res.end();
                } 
                model.data = result[0];
                res.render('admin/code/category/mod', {model:model, userObj: req.cookies.userObj});
            });
        }
    });
};

// modForm GET
exports.mod = (req, res) => {

    var jsonData = req.body;
    
    var obj = { category_name: jsonData['category_name'] };

    connection.query('UPDATE category SET ? WHERE id = ' + req.params.id, [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.status(400).json({ 'msg': "error" });
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};