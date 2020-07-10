//main 부분
var express = require('express');
var router = express.Router();
const config = require('../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../public/js/common');

const fs = require('fs'); 
const mime = require('mime-types');
const path = require('path');
const filePath = path.join(__dirname, '../public/uploads/')


//라우터의 get()함수를 이용해 request URL('/')에 대한 업무처리 로직 정의
router.get('/', function(req, res) {

    console.log("오니?..")

    let model = {};

    //나라 목록
    var countries_sql = 'SELECT a.id, a.country_name, a.code, COUNT(b.id) as count FROM countries a LEFT OUTER JOIN company b ON a.id = b.country_id' +
        ' WHERE a.showYN = "Y"  GROUP BY a.id ORDER BY id DESC; '; 
        
    var category_sql = 'SELECT COUNT(*) as cnt FROM category WHERE useYN = "Y"; ';

    var company_sql = 'SELECT COUNT(*) as cnt FROM company'

    var carousel_sql = "SELECT id, title, CONCAT('size: ', '' + title_size, 'px; color:', title_color, ';') as title_style, contents, CONCAT('size: ', '' + contents_size, 'px; color:', contents_color, ';') as contents_style" +
        ", file_name_org, file_name_new, size, order_, useYN FROM homepage WHERE useYN = 'Y' AND type = 1 ORDER BY order_;"

    var countries_result, category_result, carousel_result;
    
    //나라 목록
    connection.query(countries_sql, function(err, result) {

        if (err) {   
            console.log(err);
            res.end();
        } else {
            countries_result = result;

            //카테고리 수
            connection.query(category_sql, function(err, result) {

                category_result = result;
                    
                if (err) {   
                    console.log(err);
                    res.end();
                } else {
                    
                    //carousel 리스트
                    connection.query(carousel_sql, function(err, result) {
                        
                        carousel_result = result;

                        if (err) {   
                            console.log(err);
                            res.end();
                        } else {

                            //comapny 리스트
                            connection.query(company_sql, function(err, result) {
                                
                                company_result = result;

                                if (err) {   
                                    console.log(err);
                                    res.end();
                                } else {
            
                                    //값 세팅
                                    model.countries = countries_result;
                                    model.countriesCnt = countries_result.length;
                                    model.category = category_result;
                                    model.carousel = carousel_result;
                                    model.company = company_result;

                                    res.render('index', { model: model, comma: common.comma, userObj: req.cookies.userObj });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

router.get('/download/:tableName/:id', function(req, res) {

    console.log(req.params)

    var sql = "SELECT path, filename FROM  " + req.params.tableName + " WHERE id = " + req.params.id;
    
    connection.query(sql, (err, result) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
    
          var file = filePath + '/' + result[0].path + result[0].filename;
        
          var filename = path.basename(file);
          var mimetype = mime.lookup(file);
        
          res.setHeader('Content-disposition', 'attachment; filename=' + filename);
          res.setHeader('Content-type', mimetype);
        
          var filestream = fs.createReadStream(file);
          filestream.pipe(res);
       }
    });
  });



//모듈에 등록해야 web.js에서 app.use 함수를 통해서 사용 가능
module.exports = router;