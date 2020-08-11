//main 부분
var express = require('express');
var router = express.Router();
const config = require('../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../public/js/common');

const mysql2 = require('sync-mysql');
var connection2 = new mysql2(config.info);

const fs = require('fs'); 
const mime = require('mime-types');
const path = require('path');
const filePath = path.join(__dirname, '../public/uploads/')

//오늘 날짜
var moment = require('moment');
require('moment-timezone');
const format = 'HH:mm:ss';


//라우터의 get()함수를 이용해 request URL('/')에 대한 업무처리 로직 정의
router.get('/', function(req, res) {

    console.log("첫 화면 입니다~")

    let model = {};
    var countries_result, category_result, inquery_result, update_result, product_result;

    //나라 목록
    var countries_sql = 'SELECT a.id, a.country_name, a.code, COUNT(b.id) as count FROM countries a LEFT OUTER JOIN company b ON a.id = b.country_id' +
        ' WHERE a.showYN = "Y"  GROUP BY a.id ORDER BY id DESC; ';

    var category_sql = 'SELECT COUNT(*) as cnt FROM category WHERE useYN = "Y"; ';

    var company_sql = 'SELECT COUNT(*) as cnt FROM company'

   // var carousel_sql = "SELECT id, title, CONCAT('size: ', '' + title_size, 'px; color:', title_color, ';') as title_style, contents, CONCAT('size: ', '' + contents_size, 'px; color:', contents_color, ';') as contents_style" +
        //", file_name_org, file_name_new, size, order_, useYN FROM homepage WHERE useYN = 'Y' AND type = 1 ORDER BY order_;"



    var inquery_sql = 'SELECT C.name_eng, R.companyId, COUNT(R.companyId) AS cnt\n' +
        'from company AS C\n' +
        'LEFT JOIN recently_viewed AS R ON C.id = R.companyId\n' +
        'group by R.companyId\n' +
        'order by cnt desc\n' +
        'limit 7;';

    var update_sql = 'SELECT id, name_eng, createdAt, updatedAt from company AS C\n' +
        'order by updatedAt desc limit 7;';

    var product_sql = 'SELECT P.companyId, COUNT(distinct P.userId) AS ucnt, C.name_eng from purchasedproduct AS P\n' +
        'LEFT JOIN company AS C\n' +
        'ON P.companyId = C.id\n' +
        'group by P.companyId\n' +
        'order by COUNT(distinct P.userId) desc limit 7;';

    inquery_result = connection2.query(inquery_sql);
    update_result = connection2.query(update_sql);
    product_result = connection2.query(product_sql);

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

                    //carousel 리스트 //메인에 있던 이미지
                    /*connection.query(carousel_sql, function(err, result) {

                        carousel_result = result;

                        if (err) {
                            console.log(err);
                            res.end();
                        } else {*/

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
                                    //model.carousel = carousel_result;
                                    model.company = company_result;
                                    model.inquery = inquery_result;
                                    model.update = update_result;
                                    model.product = product_result;


                                    res.render('index', { model: model, comma: common.comma, userObj: req.cookies.userObj });

                                }
                            });
                        //}
                    //});
                }
            });
        }
    });
});

//이 부분은 예전에 홈페이지 메인에 사진을 넣었는데
//그로 인해 필요한 부분입니다.
/*router.get('/download/:tableName/:id', function(req, res) {

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
  });*/



//모듈에 등록해야 web.js에서 app.use 함수를 통해서 사용 가능
module.exports = router;