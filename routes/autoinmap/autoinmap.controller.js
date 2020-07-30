const config = require('../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

const mysql2 = require('sync-mysql'); //원래 javascript는 비동기인데 sync-mysql로 동기 설정 가능
var connection2 = new mysql2(config.info);

//autoinmap 첫 화면
exports.autoinmap = (req, res) => {
    let model = {};
    var countries_result, category1, category2, category3;
    var sql_infoCountry, sql_category1, sql_category2;

    sql_infoCountry = 'SELECT a.id, a.country_name, a.code, COUNT(b.id) as count FROM countries a LEFT OUTER JOIN company b ON a.id = b.country_id WHERE a.showYN = "Y"  GROUP BY a.id ORDER BY id DESC; ';
    sql_category1 = 'SELECT id, category_name from category where depth=1;';
    sql_category2 = 'SELECT parent_id, category_name from category where depth=2; ';



    category1 = connection2.query(sql_category1);
    category2 = connection2.query(sql_category2);

    connection.query(sql_infoCountry, (err, result) => {
        if (err) {
            console.log(err);
            res.end();
        } else {
            countries_result = result;
            model.countries = countries_result;
            model.category1 = category1;
            model.category2 = category2;
            res.render("autoinmap/autoinmap", {model: model, userObj: req.cookies.userObj});
        }
    });

};


//지도에서 국가 선택시
exports.getCategory1 = (req, res) => {
    var jsondata = req.body;
    var result;
    var countryId = jsondata['countryId'];


    var sql_countryName = "SELECT country_name from countries WHERE id = " + countryId;
    var countryName = connection2.query(sql_countryName);

    //국가 선택시 depth1의 각 카테고리 별로 합계 가져오기
    var sql_depth1 =
        "SELECT k.cn, k.caid, k.dp, k.cp, SUM(k.p11+k.p21+k.p31+k.p41) AS total from (\n" +
        "SELECT ca.id AS caid, ca.category_name AS cn, ca.depth AS dp, ca.parent_id AS cp,\n" +
        "COUNT(if(f.p1_depth=1,f.p1_id,null)) AS p11,\n" +
        "COUNT(if(f.p2_depth=1,f.p2_id,null)) AS p21,\n" +
        "COUNT(if(f.p3_depth=1,f.p3_id,null)) AS p31,\n" +
        "COUNT(if(f.p4_depth=1,f.p4_id,null)) AS p41,\n" +
        "COUNT(if(f.p1_depth=2,f.p1_id,null)) AS p1,\n" +
        "COUNT(if(f.p2_depth=2,f.p2_id,null)) AS p2,\n" +
        "COUNT(if(f.p3_depth=2,f.p3_id,null)) AS p3,\n" +
        "COUNT(if(f.p4_depth=2,f.p4_id,null)) AS p4\n" +
        "from category AS ca\n" +
        "LEFT JOIN \n" +
        "(\n" +
        "SELECT\n" +
        "e.id AS p1_id, e.depth AS p1_depth,\n" +
        "d.id AS p2_id, d.depth AS p2_depth,\n" +
        "c.id AS p3_id, c.depth AS p3_depth,\n" +
        "b.id AS p4_id, b.depth AS p4_depth\n" +
        "FROM company_category a \n" +
        "LEFT OUTER JOIN company CC ON CC.id = a.id \n" +
        "LEFT OUTER JOIN category b  ON a.category_id = b.id \n" +
        "LEFT OUTER JOIN category c ON b.parent_id = c.id\n" +
        "LEFT OUTER JOIN category d ON c.parent_id = d.id\n" +
        "LEFT OUTER JOIN category e ON d.parent_id = e.id\n" +
        "WHERE CC.country_id = "+countryId+"\n" +
        ") AS f\n" +
        "ON ca.id = f.p1_id OR ca.id = f.p2_id OR ca.id = f.p3_id OR ca.id = f.p4_id\n" +
        "WHERE ca.depth=1 OR ca.depth = 2\n" +
        "GROUP BY ca.id\n" +
        ") AS k\n" +
        "group by k.caid;"

    result = connection2.query(sql_depth1);
    res.status(200).json({ 'data': result, 'country':countryName});
};
