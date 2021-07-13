const config = require('../../../conf/environments');
const common = require('../../../public/js/common');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

const mysql2 = require('sync-mysql');
var connection2 = new mysql2(config.info);

//시간 관련
var moment = require('moment');
require('moment-timezone');
var format = 'YYYY-MM-DD HH:mm:ss';

//query 실행 함수
const queryExec = (sql, v) => new Promise ((resolve, reject) => {
    connection.query(sql, v, function (err, res) {
        if (err) {
            connection.rollback(function() {
                console.log(err)
                throw err;
            });
        } else {
            resolve(res) // reject는 예외 처리를 할 때 사용합니다.
        }
    })
});

// 목록 GET
exports.list = (req, res) => {

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //검색 옵션
    var country_id = req.query.country_id || 0;
    var search_bn = req.query.search_bn || "";
    var search_pg = req.query.search_pg || "";
    var search_cate = req.query.search_cate || "";
    var search_type = req.query.search_type || 1;
    var search_txt = req.query.search_txt || "";

    //나라 목록
    var countries_sql = 'SELECT id, country_name FROM countries WHERE showYN = "Y" ORDER BY id DESC; '

    let countries_result = connection2.query(countries_sql);

    //공통 sql
    var join = ' LEFT OUTER JOIN company_category c ON a.id = c.id LEFT OUTER JOIN category d ON c.category_id = d.id ' +
                'LEFT OUTER JOIN category e ON d.parent_id = e.id LEFT OUTER JOIN category f ON e.parent_id = f.id '

    //검색 적용
    var where = "";

    //통합 검색
    if (search_type == 1) //ALL
        where += "  WHERE (name_eng LIKE '%" + search_txt + "%' OR ceo LIKE '%" + search_txt + "%' OR main_product LIKE '%" + search_txt + "%') "
    else if (search_type == 2) //COMPANY
        where += "  WHERE (name_eng LIKE '%" + search_txt + "%') "
    else if (search_type == 3)
        where += "  WHERE (ceo LIKE '%" + search_txt + "%') "
    else 
        where += "  WHERE (main_product LIKE '%" + search_txt + "%') "

    //나라
    if (country_id != 0) {
        where += ' AND country_id =' + parseInt(country_id) + " ";
    }
    //BUSINESS NATURE
    if (search_bn != 0) {
        where += " AND business_nature LIKE '%$" + search_bn + "$%' ";
    }
    //PRODUCT GROUP
    if (search_pg != 0) {
        where += " AND product_group LIKE '%$" + search_pg + "$%' ";
    }
    //CATEGORY
    if (search_cate != "") {
        where += " AND (d.id =" + search_cate + " OR e.id =" + search_cate + " OR f.id =" + search_cate + " OR f.parent_id =" + search_cate + ")";
    }

    var count_sql = 'SELECT COUNT(DISTINCT a.id) AS cnt FROM company a ' + join + where;
    

    let count_result = connection2.query(count_sql);

    var totalCount = Number(count_result[0].cnt); // NOTE: 전체 글 개수.
    var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
    var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
    let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

    //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
    var sql ="SELECT DISTINCT a.id, a.country_id, a.name_kor, a.name_eng, a.main_product, a.address, a.ceo, a.email, a.website, a.creditRating, a.cashFlowRating, a.watchRating, IFNULL(a.opinion_eng, '') as opinion_eng, a.updatedAt, b.country_name" +
        " FROM company a LEFT OUTER JOIN countries b ON a.country_id = b.id " + join + where + ' ORDER BY a.updatedAt DESC, a.id DESC LIMIT ?,?';

    let rs = connection2.query(sql, [skipSize, contentSize]);

    for (var i=0; i<rs.length; i++) {

        var data = rs[i];

        var map = { website:false, email: false, creditRating: false,  cashFlowRating: false, watchRating: false, opinion: false, ms: false, rc: false, msps: false, 
            mpp: false, ssofp: false, cis: false, sfr: false, pr: false, sr: false, cc: false,  mv: false, for: false, es: false, certification: false};

        //있는지 체크
        if (data.website != undefined && data.website != null && data.website != "") { map['website'] = true; } 
        if (data.email != undefined && data.email != null && data.email != "") { map['email'] = true; } 
        if (data.creditRating != undefined && data.creditRating != null && data.creditRating != "") { map['creditRating'] = true; }  
        if (data.cashFlowRating != undefined && data.cashFlowRating != null && data.cashFlowRating != "") { map['cashFlowRating'] = true; }  
        if (data.watchRating != undefined && data.watchRating != null && data.watchRating != "") { map['watchRating'] = true; }  


        //종합 의견 값 있는지 체크
        var opinion = data.opinion_eng;
        opinion = common.removeBlankExcelData(opinion)
        if (opinion != undefined && opinion != null && opinion != "") { map['opinion'] = true; }

        var sql5 ="SELECT DISTINCT a.id, COUNT(b.companyId) as ms, COUNT(c.companyId) as rc, COUNT(d.companyId) as msp, COUNT(e.companyId) as mpp, COUNT(f.companyId) as ssofp, COUNT(g.companyId) as cis, COUNT(h.companyId) as sfr, " + 
                    " COUNT(i.companyId) as pr, COUNT(j.companyId) as sr, COUNT(k.companyId) as cc, COUNT(l.companyId) as mv, COUNT(m.companyId) as for_, COUNT(n.companyId) as es FROM company a" + 
                    " LEFT OUTER JOIN company_ms b ON a.id = b.companyId" + 
                    " LEFT OUTER JOIN company_rc c ON a.id = c.companyId" +
                    " LEFT OUTER JOIN company_partner d ON a.id = d.companyId AND d.type ='msp'" +
                    " LEFT OUTER JOIN company_partner e ON a.id = e.companyId AND d.type ='mpp'" +
                    " LEFT OUTER JOIN company_ssofp f ON a.id = f.companyId" +
                    " LEFT OUTER JOIN company_cis g ON a.id = g.companyId" +
                    " LEFT OUTER JOIN company_sfr h ON a.id = h.companyId" +
                    " LEFT OUTER JOIN company_pr i ON a.id = i.companyId" +
                    " LEFT OUTER JOIN company_sr j ON a.id = j.companyId" +
                    " LEFT OUTER JOIN company_cc k ON a.id = k.companyId" +
                    " LEFT OUTER JOIN company_mv l ON a.id = l.companyId" +
                    " LEFT OUTER JOIN company_for m ON a.id = m.companyId" +
                    " LEFT OUTER JOIN company_es n ON a.id = n.companyId" +
                    " WHERE a.id = ?";

        let result5 = connection2.query(sql5, [ data.id ]);
        var data5 = result5[0];
        if (data5.ms > 0) { map['ms'] = true; } 
        if (data5.rc > 0) { map['rc'] = true; } 
        if (data5.msp > 0) { map['msp'] = true; } 
        if (data5.mpp > 0) { map['mpp'] = true; } 
        if (data5.ssofp > 0) { map['ssofp'] = true; } 
        if (data5.cis > 0) { map['cis'] = true; } 
        if (data5.sfr > 0) { map['sfr'] = true; } 
        if (data5.pr > 0) { map['pr'] = true; } 
        if (data5.sr > 0) { map['sr'] = true; } 
        if (data5.cc > 0) { map['cc'] = true; } 
        if (data5.mv > 0) { map['mv'] = true; } 
        if (data5.for_ > 0) { map['for'] = true; } 
        if (data5.es > 0) { map['es'] = true; } 

        rs[i].map = map;
    }

    if (pnEnd > pnTotal) pnEnd = pnTotal; // NOTE: 페이지네이션의 끝 번호가 페이지네이션 전체 카운트보다 높을 경우.
    const result = {
        totalCount,
        pageNum,
        pnStart,
        pnEnd,
        pnTotal,
        contents: rs,
        countriesList: countries_result
    };
    
    res.render('admin/company/list', {model:result, comma: common.comma, userObj: req.cookies.userObj, moment: moment});
};

// 목록 GET
exports.searchCompany = (req, res) => {

    var data = req.body;

    var sql ="SELECT id, name_eng, ceo FROM company WHERE name_kor = ?";

    connection.query(sql,[data['name_kor']], (err, rs) => {   

        if(err){   
            console.log(err);
            res.end();
        } else {

            console.log(rs)
            //값 여부
            var result = {
                len : (rs != undefined) ? rs.length : 0,
                rs : (rs != undefined) ? rs[0] : undefined,
            } 

            res.json({ "result": result });
        }
    });
                
};

// 목록 GET
exports.modalList = (req, res) => {

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.
    var countriesList;

    //검색 옵션
    var country_id = req.query.country_id || 0;
    var search_bn = req.query.search_bn || "";
    var search_pg = req.query.search_pg || "";
    var search_cate = req.query.search_cate || "";
    var search_type = req.query.search_type || 1;
    var search_txt = req.query.search_txt || "";
    var inputnm_id = req.query.inputnm_id || "";
    var inputcom_id = req.query.inputcom_id || "";

    //나라 목록
    var sql1 = 'SELECT id, country_name FROM countries ' +
        ' WHERE showYN = "Y" ORDER BY id DESC; '

    var sql2 = 'SELECT COUNT(*) AS cnt FROM company';

    //검색 적용

    //통합 검색
    if (search_type == 1) 
        sql2 += "  WHERE (name_eng LIKE '%" + search_txt + "%' OR name_kor LIKE '%" + search_txt + "%' OR ceo LIKE '%" + search_txt + "%' OR main_product LIKE '%" + search_txt + "%') "
    else if (search_type == 2)
        sql2 += "  WHERE (name_eng LIKE '%" + search_txt + "%' OR name_kor LIKE '%" + search_txt + "%') "
    else if (search_type == 3)
        sql2 += "  WHERE (ceo LIKE '%" + search_txt + "%') "
    else 
        sql2 += "  WHERE (main_product LIKE '%" + search_txt + "%') "

    //나라
    if (country_id != 0) {
        sql2 += ' AND country_id =' + parseInt(country_id) + " ";
    }
    //BUSINESS NATURE
    if (search_bn != 0) {
        sql2 += " AND business_nature LIKE '%$" + search_bn + "$%' ";
    }
    //PRODUCT GROUP
    if (search_pg != 0) {
        sql2 += " AND product_group LIKE '%$" + search_pg + "$%' ";
    }
    //CATEGORY
    if (search_cate != "") {
        sql2 += " AND category LIKE '%|" + search_cate + "%' ";
    }
    

    connection.query(sql1, (err,result) => {

        if(err) {
            console.log(err);
            res.end();
        } else {
            countriesList = result;

            //행 개수 구하는 쿼리 실행
            connection.query(sql2, (err,result) => {  //전체 글목록 행 갯수 구하기

                if(err) {
                    console.log(err);
                    res.end();
                } else {
                
                var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
                var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
                var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
                let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

                //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
                var sql ="SELECT a.id, a.country_id, a.name_kor, a.name_eng, a.main_product, a.address, a.ceo, a.updatedAt, b.country_name" +
                    " FROM company a LEFT OUTER JOIN countries b ON a.country_id = b.id";

                //통합 검색
                 if (search_type == 1) 
                    sql += " WHERE (name_eng LIKE '%" + search_txt + "%' OR ceo LIKE '%" + search_txt + "%' OR main_product LIKE '%" + search_txt + "%') "
                else if (search_type == 2)
                    sql += " WHERE (name_eng LIKE '%" + search_txt + "%' OR name_kor LIKE '%" + search_txt + "%') "
                else if (search_type == 3)
                    sql += " WHERE (ceo LIKE '%" + search_txt + "%') "
                else 
                    sql += " WHERE (main_product LIKE '%" + search_txt + "%') "

                //나라
                if (country_id != 0) {
                    sql += ' AND country_id =' + parseInt(country_id) + " ";
                }
                //BUSINESS NATURE
                if (search_bn != 0) {
                    sql += " AND business_nature LIKE '%$" + search_bn + "$%' ";
                }
                //PRODUCT GROUP
                if (search_pg != 0) {
                    sql += " AND product_group LIKE '%$" + search_pg + "$%' ";
                }
                //CATEGORY
                if (search_cate != "") {
                    sql += " AND category LIKE '%|" + search_cate + "%' ";
                }

                sql += ' ORDER BY a.updatedAt DESC, a.id DESC LIMIT ?,?'

                connection.query(sql,[skipSize, contentSize], (err,rs) => {   
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
                        countriesList: countriesList
                    };
                        res.render('admin/company/modal', {model:result, userObj: req.cookies.userObj, moment: moment});
                    }
                });
                }
                
            });
        }
    });
};

exports.addForm = (req, res) => {

    let model = {};

    var sql1 = 'SELECT id, country_name, showYN, detailYN FROM countries WHERE showYN = "Y" ORDER BY id DESC; '; // 나라 목록
    var sql2 = 'SELECT id, name_kor, name_eng, field_code, order_ FROM field WHERE useYN = "Y" AND delYN = "N" ORDER BY order_ ASC; '; // 필드 목록
    var rating_sql = 'SELECT type, id, name, subname, contents, color, order_, useYN, createdAt FROM rating WHERE delYN = "N" ORDER BY order_ DESC; ';
    var certification_sql = 'SELECT id, code FROM certification WHERE useYN = "Y" AND delYN = "N" ORDER BY order_;';

    connection.query(sql1 + sql2 + certification_sql + rating_sql, function(err, results){
        var sql1_result = results[0];	//sql1 의 결과값
        var sql2_result = results[1];	//sql2 의 결과값
        var certification_result = results[2];	//certification_sql 의 결과값
        var rating_result = results[3];

        if (err) {   
            console.log(err);
            res.end();
        } else {
            model.countriesList = sql1_result;
            model.fieldList = sql2_result;
            model.certifiList = certification_result;
            model.ratingList = rating_result;
            res.render('admin/company/add', { model: model, userObj: req.cookies.userObj });
        }
    });
};

exports.add = (req, res) => {

    var query = [];
    var data = req.body;
    var company_id;
    var unique_key;
    var sub_result;

    var sql = 'SELECT id, name_kor, name_eng, field_code, order_ FROM field WHERE useYN = "Y" AND delYN = "N" ORDER BY order_ ASC; '; // 필드 목록
    connection.query(sql, (err,result) => { 

        sub_result = result; 

        //business nature(형태: $번호$번호$)
        var business_nature = data.business_nature;
        var business_nature_txt = "";
        if (business_nature != undefined) {
            if (business_nature.length > 0) {
                for (var i=0; i<business_nature.length; i++) {
                    business_nature_txt += business_nature[i] + '$';
                }
                business_nature_txt = '$' + business_nature_txt;
            }
        }
         
        //product_group(형태: $번호$번호$)
        var product_group = data.product_group;
        var product_group_txt = "";
        if (product_group != undefined) {
            if (product_group.length > 0) {
                for (var i=0; i<product_group.length; i++) {
                    product_group_txt += product_group[i] + '$';
                }
                product_group_txt = '$' + product_group_txt;
            }
        }
    
        //certification(형태: $번호$번호$)
        var certification = data.certification;
        var certification_txt = "";
        if (certification != undefined) {
            if (certification.length > 0) {
                for (var i=0; i<certification.length; i++) {
                    certification_txt += certification[i] + '$';
                }
                certification_txt = '$' + certification_txt;
            }
        }

        //opinion
        var opinion = "";
        if (data.opinion_eng != undefined) {
            opinion = common.replaceAll(data.opinion_eng, /\n/g, "<br>")
        }

        unique_key = data.country_id + "_" + data.brn + "_" + data.name_eng;
       
        //company
        var company = {
            country_id: data.country_id,
            name_eng: data.name_eng, ceo: data.ceo,
            established: data.established, NoOfEmployees: data.NoOfEmployees,
            brn: data.brn, address: data.address,
            headOfficeNumber: data.headOfficeNumber, fax: data.fax,
            email: data.email, website: data.website,
            main_product: data.main_product, creditRating: data.creditRating,
            cashFlowRating: data.cashFlowRating, watchRating: data.watchRating,
            opinion_eng: opinion, product_group: product_group_txt, unique_key: unique_key,
            business_nature: business_nature_txt, certification: certification_txt, create_id: req.cookies.userObj.id, createdAt: moment.utc().format(format),
        }

        sql = 'INSERT INTO company SET ?';
        connection.query(sql, company, function(err, result) {
            if (err) {
                console.log(err);
            } else {
                company_id = result.insertId;

                //sub
                for (key in sub_result) {
                    if (data[sub_result[key].field_code] != '' || data[sub_result[key].field_code] != undefined) {
                        query.push(queryExec('INSERT INTO company_sub VALUES (?, ?, ?, ?)', [unique_key, sub_result[key].id, data[sub_result[key].field_code], unique_key + "_" + sub_result[key].id]));
                    }
                }

                //category
                var cateMap = data.cateMap;
                var cate_arr = [];
                for (var key in cateMap) {
                    if (cateMap[key] != '') {
                        cate_arr.push([company_id, cateMap[key]]);
                    }
                }

                //카테고리
                for (var i=0; i<cate_arr.length; i++) {
                    query.push(queryExec('INSERT INTO company_category VALUES (?, ?)', cate_arr[i]));
                }

                //ms(주요주주현황)
                if (data.ms_value_0 != undefined) {
                    for (var i=0; i<data.ms_value_0.length; i++) {
                        query.push(queryExec('INSERT INTO company_ms VALUES (?, ?, ?, ?, ?);', [company_id, data.ms_value_0[i], data.ms_value_1[i], common.replaceAll(data.ms_value_2[i],"%",""), i]));
                    }
                }
            
                //rc(관계사 현황)
                if (data.rc_value_1 != undefined) {
                    for (var i=0; i<data.rc_value_1.length; i++) {
                        var relCompanyId = data.rc_company[i];
                        if (parseInt(relCompanyId) != 0) {
                            query.push(queryExec('INSERT INTO company_rc VALUES (?, ?, ?, ?, ?, ?); ', [company_id, parseInt(relCompanyId), '', '', common.replaceAll(data.rc_value_2[i],"%",""), i]));
                        } else {
                            query.push(queryExec('INSERT INTO company_rc VALUES (?, ?, ?, ?, ?, ?); ', [company_id, 0, data.rc_companyName[i], data.rc_value_1[i], common.replaceAll(data.rc_value_2[i],"%",""), i]));
                        }
                    }
                }
            
                //msp(관계사 현황)
                var sql = 'INSERT INTO company_partner VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); '
                if (data.msp_value_1 != undefined) {
                    for (var i=0; i<data.msp_value_1.length; i++) {
                        //check
                        var partnerId = data.msp_company[i];
                        if (parseInt(partnerId) != 0) {
                            query.push(queryExec(sql, 
                                    [company_id, 'msp', parseInt(partnerId), '', '', '', common.replaceAll(data.msp_value_3[i],"%",""), common.replaceAll(data.msp_value_3[i],"%",""), common.replaceAll(common.replaceAll(data.msp_value_4[i],",",""), "-", "0"), 
                                    common.replaceAll(common.replaceAll(data.msp_value_5[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.msp_value_6[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.msp_value_7[i],",",""), "-", "0"), i]));
                        } else {
                            query.push(queryExec(sql, [company_id, 'msp', 0, data.msp_companyName[i], data.msp_value_1[i], data.msp_value_2[i], common.replaceAll(data.msp_value_3[i],"%",""), common.replaceAll(common.replaceAll(data.msp_value_4[i],",",""), "-", "0"), 
                                common.replaceAll(common.replaceAll(data.msp_value_5[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.msp_value_6[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.msp_value_7[i],",",""), "-", "0"), i]));
                        }
                    }
                }
            
                //mpp(관계사 현황)
                if (data.mpp_value_1 != undefined) {
                    for (var i=0; i<data.mpp_value_1.length; i++) {
                        //check
                        var partnerId = data.mpp_company[i];
                        if (parseInt(partnerId) != 0) {
                            query.push(queryExec(sql, [company_id, 'mpp', parseInt(partnerId), '', '', '', common.replaceAll(data.mpp_value_3[i],"%",""), common.replaceAll(data.mpp_value_3[i],"%",""), 
                                common.replaceAll(common.replaceAll(data.mpp_value_4[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.mpp_value_5[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.mpp_value_6[i],",",""), "-", "0"), 
                                common.replaceAll(common.replaceAll(data.mpp_value_7[i],",",""), "-", "0"), i]));
                        } else {
                            query.push(queryExec(sql, [company_id, 'mpp', 0, data.mpp_companyName[i], data.mpp_value_1[i], data.mpp_value_2[i], common.replaceAll(data.mpp_value_3[i],"%",""), 
                                common.replaceAll(common.replaceAll(data.mpp_value_4[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.mpp_value_5[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.mpp_value_6[i],",",""), "-", "0"), 
                                common.replaceAll(common.replaceAll(data.mpp_value_7[i],",",""), "-", "0"), i]));
                        }
                    }
                }
            
                //ssofp(요약재무상태표)
                if (data.ssofp_value_0 != undefined) {
                    var sql = 'INSERT INTO company_ssofp VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); '  
                    for (var i=0; i<data.ssofp_value_0.length; i++) {
                        query.push(queryExec(sql, [company_id, data.ssofp_value_0[i], common.replaceAll(common.replaceAll(data.ssofp_value_1[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_2[i],",",""), "-", "0"), 
                        common.replaceAll(common.replaceAll(data.ssofp_value_3[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_4[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_5[i],",",""), "-", "0"),
                        common.replaceAll(common.replaceAll(data.ssofp_value_6[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_7[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_8[i],",",""), "-", "0"), i]));
                    }
                }
            
                //cis()
                if (data.cis_value_0 != undefined) {
                    var sql = 'INSERT INTO company_cis VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); '  
                    for (var i=0; i<data.cis_value_0.length; i++) {
                        query.push(queryExec(sql, [company_id, data.cis_value_0[i], common.replaceAll(common.replaceAll(data.cis_value_1[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_2[i],",",""), "-", "0"), 
                        common.replaceAll(common.replaceAll(data.cis_value_3[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_4[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_5[i],",",""), "-", "0"),
                        common.replaceAll(common.replaceAll(data.cis_value_6[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_7[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_8[i],",",""), "-", "0"), i]));
                    }
                }
            
                //sfr()
                if (data.sfr_value_0 != undefined) {
                    var sql = 'INSERT INTO company_sfr SET ? ;'  
                    for (var i=0; i<data.sfr_value_0.length; i++) {
                        var obj = {
                            'companyId': company_id, 'title_': common.replaceAll(data.sfr_value_0[i],",",""), 'growthRateOfTotalAssets': common.replaceAll(common.replaceAll(data.sfr_value_1[i],",",""), "-", "0"),
                            'growthRateOfSales': common.replaceAll(common.replaceAll(data.sfr_value_2[i],",",""), "-", "0"), 'netProfitGrowthRate': Number(common.replaceAll(common.replaceAll(data.sfr_value_3[i],",",""), "-", "0")), 'profitMargin': common.replaceAll(common.replaceAll(data.sfr_value_4[i],",",""), "-", "0"), 
                            'ROE': common.replaceAll(common.replaceAll(data.sfr_value_5[i],",",""), "-", "0"), 'ROIC': common.replaceAll(common.replaceAll(data.sfr_value_6[i],",",""), "-", "0"), 'debtRatio': common.replaceAll(common.replaceAll(data.sfr_value_7[i],",",""), "-", "0"),
                            'EBIT_interestCoverageRatio': common.replaceAll(common.replaceAll(data.sfr_value_8[i],",",""), "-", "0"), 'TBABPTTA': common.replaceAll(common.replaceAll(data.sfr_value_9[i],",",""), "-", "0"), 'receivablesTO': common.replaceAll(common.replaceAll(data.sfr_value_10[i],",",""), "-", "0"), 
                            'inventoryTO': common.replaceAll(common.replaceAll(data.sfr_value_11[i],",",""), "-", "0"), 'totalAssetTO': common.replaceAll(common.replaceAll(data.sfr_value_12[i],",",""), "-", "0"), 'order_': i
                        }
                        query.push(queryExec(sql, obj));
                        }
                }
            
                //pr(제품생산비율)
                if (data.pr_value_0 != undefined) {
                    for (var i=0; i<data.pr_value_0.length; i++) {
                        query.push(queryExec('INSERT INTO company_pr VALUES (?, ?, ?, ?); ', 
                                [company_id, i, data.pr_value_0[i], common.replaceAll(data.pr_value_1[i],"%","")]));
                    }
                }
            
                //sr(제품생산비율)
                if (data.sr_value_0 != undefined) {
                    for (var i=0; i<data.sr_value_0.length; i++) {
                        query.push(queryExec('INSERT INTO company_sr VALUES (?, ?, ?, ?); ', 
                                [company_id, i, data.sr_value_0[i], common.replaceAll(data.sr_value_1[i],"%","")]));
                    }
                }
            
                //cc(구성비)
                if (data.cc_value_0 != undefined) {
                    for (var i=0; i<data.cc_value_0.length; i++) {
                        query.push(queryExec('INSERT INTO company_cc VALUES (?, ?, ?, ?); ', 
                                [company_id, i, data.cc_value_0[i], common.replaceAll(data.cc_value_1[i],"%","")]));
                    }
                }
            
                //mv(주요주주현황)
                if (data.mv_value_1 != undefined) {
                    for (var i=0; i<data.mv_value_1.length; i++) {
                        //check
                        var relCompanyId = data.mv_company[i];
                        if (parseInt(relCompanyId) != 0) {
                            query.push(queryExec('INSERT INTO company_mv VALUES (?, ?, ?, ?, ?); ', 
                            [company_id, parseInt(relCompanyId), '', common.replaceAll(data.mv_value_1[i],"%",""), i]));
                        } else {
                            query.push(queryExec('INSERT INTO company_mv VALUES (?, ?, ?, ?, ?); ', 
                            [company_id, 0, data.mv_companyName[i], common.replaceAll(data.mv_value_1[i],"%",""), i]));
                        }
                    }
                }
            
                //for(주요주주현황)
                if (data.for_value_0 != undefined) {
                    for (var i=0; i<data.for_value_0.length; i++) {
                        query.push(queryExec('INSERT INTO company_for VALUES (?, ?, ?, ?, ?); ', 
                                [company_id, i, data.for_value_0[i], common.replaceAll(data.for_value_1[i],"%",""), common.replaceAll(data.for_value_2[i],"%","")]));
                    } 
                }

                //es(인원현황)
                if (data.es_value_0 != undefined) {
                    for (var i=0; i<data.es_value_0.length; i++) {
                        query.push(queryExec('INSERT INTO company_es VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE operator = VALUES(operator), maintenance = VALUES(maintenance), supervisor = VALUES(supervisor), accountant = VALUES(accountant), sales = VALUES(sales), logistic = VALUES(logistic), material = VALUES(material), quality = VALUES(quality), r_d = VALUES(r_d), logistic_sales = VALUES(logistic_sales), total = VALUES(total); ', 
                                [company_id, data.es_value_0[i], data.es_value_1[i], data.es_value_2[i], data.es_value_3[i], data.es_value_4[i], data.es_value_5[i], data.es_value_6[i], data.es_value_7[i],
                                data.es_value_8[i], data.es_value_9[i], data.es_value_10[i]]));
                    }
                }
            
                //시작,,
                (async () => {
                    try {
                        Promise
                        .all(query)
                        .then(values => {
                            connection.commit(function(err) {
                                if (err) { 
                                    connection.rollback(function() {
                                        throw err;
                                    });
                                }
                                res.json({ 'msg': '완료되었습니다.' });
                                });
                        })
                    } catch (err) {
                        console.log(err)
                        res.status(400).json({ 'status': 400, 'msg': '오류로 중지되었습니다.' });
                    }
                    })()
            }
        });

    });

}

exports.excelUploadForm = (req, res) => {

    let model = {};

    var sql1 = 'SELECT id, country_name, showYN, detailYN FROM countries WHERE showYN = "Y" ORDER BY id DESC; '; // 나라 목록
    var sql2 = 'SELECT id, name_kor, name_eng, field_code, order_ FROM field WHERE useYN = "Y" AND delYN = "N" ORDER BY order_ ASC; '; // 필드 목록

    connection.query(sql1 + sql2, function(err, results){
        var sql1_result = results[0];	//sql1 의 결과값
        var sql2_result = results[1];	//sql2 의 결과값

        if (err) {   
            console.log(err);
            res.end();
        } else {

            model.countriesList = sql1_result;
            model.fieldList = sql2_result;
            res.render('admin/company/excelUpload', { model: model , userObj: req.cookies.userObj});
        }
    });
};


//엑셀 데이터 등록
exports.excelUpload = (req, res) => {

    var fieldList = req.body.field;

    //서브 필드 항목 담기
    var map = {};
    for (var i=0; i<fieldList.length; i++) {
        map[fieldList[i].name_kor] = fieldList[i];
    }

    var data = req.body.data;
    var unit = Math.round((data.length)/4);
    var cnt = unit;
    var all_arr = [];
    var arr = [];
    var all_sub_arr = [];
    var sub_arr = [];
    var que = [];

    var obj;
    var company_eng, company_kor, brn, ceo, established, email, website, headOfficeNumber, address, fax, main_product, NoOfEmployees, unique_key, createdAt;
    var country_id = req.body.country;

    //엑셀 한줄 읽으면서 데이터 세팅!
    for (var i=0; i<data.length; i++) {
        obj = data[i];
        company_eng = common.removeBlankExcelData(data[i].회사명);

        //항목 중 회사명(영어)이 공백이거나 undefined 이면 등록안함
        if (company_eng != '' && company_eng != undefined) {
            company_kor = common.removeBlankExcelData(data[i].회사명한글);
            brn = common.removeBlankExcelData(common.replaceAll(data[i].사업자번호, '-', ''));
            ceo = common.removeBlankExcelData(data[i].대표자);
            established = common.removeBlankExcelData(data[i].설립일자);
            email = common.removeBlankExcelData(data[i].이메일);
            website = common.removeBlankExcelData(data[i].홈페이지);
            headOfficeNumber = common.removeBlankExcelData(data[i].대표전화);
            address = common.removeBlankExcelData(data[i].주소);
            fax = common.removeBlankExcelData(data[i].팩스);
            main_product = common.removeBlankExcelData(data[i].주요제품);
            NoOfEmployees = common.removeBlankExcelData(data[i].직원수);
            unique_key = country_id + '_' + brn + '_' + company_eng;
            createdAt = moment.utc().format(format); 

            arr.push([company_kor, company_eng, country_id, brn, ceo, established, email, website, headOfficeNumber, 
                address, fax, main_product, NoOfEmployees, createdAt, req.cookies.userObj.id, unique_key]);

            //sub
            for (var key in map) {
                sub_arr.push([unique_key, map[key].id,  common.removeBlankExcelData(obj[map[key].name_kor]), unique_key + "_" +  map[key].id]);
            }
            cnt--;
        }

        if (cnt == 0 || (i == data.length-1)) {
            all_arr.push(arr);
            all_sub_arr.push(sub_arr);
            cnt = unit;
            arr = [];
            sub_arr = [];
        }

        //이제 등록
        if (i == data.length-1) {

            for (var j=0;j<all_arr.length; j++) {

                 var sql1 = "INSERT INTO company (name_kor, name_eng, country_id, brn, ceo, established, email, website,"  +
                     " headOfficeNumber, address, fax, main_product, NoOfEmployees, createdAt, create_id, unique_key) VALUES ? " +
                     " ON DUPLICATE KEY UPDATE ceo = VALUES(ceo)," +
                     " established = VALUES(established), email = VALUES(email), website = VALUES(website), " +
                     " headOfficeNumber = VALUES(headOfficeNumber), address = VALUES(address), fax = VALUES(fax), " +
                     " main_product = VALUES(main_product), NoOfEmployees = VALUES(NoOfEmployees), updatedAt = VALUES(createdAt), update_id = VALUES(create_id);";
                que.push(queryExec(sql1, [all_arr[j]]));

                
                var sql2 = " INSERT INTO company_sub (company_id, field_id, value_, unique_key) VALUES ? " +
                  " ON DUPLICATE KEY UPDATE value_ = VALUES(value_);";
                que.push(queryExec(sql2, [all_sub_arr[j]]));

                //데이터 넣기 시작
                if(j == all_arr.length-1) {
                    (async () => {
                        try {
                          Promise
                            .all(que)
                            .then(values => {
                                res.json({ 'msg': '완료되었습니다.' });
                            })
                        } catch (err) {
                            console.log(err)
                            res.status(400).json({ 'status': 400, 'msg': '오류로 중지되었습니다.' });
                        }
                      })()
                }
               
            }
        }
    }

};

exports.excelDownloadPage = (req, res) => {

    let model = {};

    var sql1 = 'SELECT id, country_name, showYN, detailYN FROM countries WHERE showYN = "Y" ORDER BY id DESC; '; // 나라 목록
    var sql2 = 'SELECT id, name_kor, name_eng, field_code, order_ FROM field WHERE useYN = "Y" AND delYN = "N" ORDER BY order_ ASC; '; // 필드 목록

    connection.query(sql1 + sql2, function(err, results){
        var sql1_result = results[0];	//sql1 의 결과값
        var sql2_result = results[1];	//sql2 의 결과값

        if (err) {   
            console.log(err);
            res.end();
        } else {

            model.countriesList = sql1_result;
            model.fieldList = sql2_result;
            res.render('admin/company/excelDownload', { model: model , userObj: req.cookies.userObj});
        }
    });
};

//엑셀 데이터 다운로드
exports.excelDownload = (req, res) => {

    var fieldList = req.body.field;

    //서브 필드 항목 담기
    var map = {};
    for (var i=0; i<fieldList.length; i++) {
        map[fieldList[i].name_kor] = fieldList[i];
    }

    var data = req.body.data;
    var unit = Math.round((data.length)/4);
    var cnt = unit;
    var all_arr = [];
    var arr = [];
    var all_sub_arr = [];
    var sub_arr = [];
    var que = [];

    var obj;
    var company_eng, company_kor, brn, ceo, established, email, website, headOfficeNumber, address, fax, main_product, NoOfEmployees, unique_key, createdAt;
    var country_id = req.body.country;

    //엑셀 한줄 읽으면서 데이터 세팅!
    for (var i=0; i<data.length; i++) {
        obj = data[i];
        company_eng = common.removeBlankExcelData(data[i].회사명);

        //항목 중 회사명(영어)이 공백이거나 undefined 이면 등록안함
        if (company_eng != '' && company_eng != undefined) {
            company_kor = common.removeBlankExcelData(data[i].회사명한글);
            brn = common.removeBlankExcelData(common.replaceAll(data[i].사업자번호, '-', ''));
            ceo = common.removeBlankExcelData(data[i].대표자);
            established = common.removeBlankExcelData(data[i].설립일자);
            email = common.removeBlankExcelData(data[i].이메일);
            website = common.removeBlankExcelData(data[i].홈페이지);
            headOfficeNumber = common.removeBlankExcelData(data[i].대표전화);
            address = common.removeBlankExcelData(data[i].주소);
            fax = common.removeBlankExcelData(data[i].팩스);
            main_product = common.removeBlankExcelData(data[i].주요제품);
            NoOfEmployees = common.removeBlankExcelData(data[i].직원수);
            unique_key = country_id + '_' + brn + '_' + company_eng;
            createdAt = moment.utc().format(format); 

            arr.push([company_kor, company_eng, country_id, brn, ceo, established, email, website, headOfficeNumber, 
                address, fax, main_product, NoOfEmployees, createdAt, req.cookies.userObj.id, unique_key]);

            //sub
            for (var key in map) {
                sub_arr.push([unique_key, map[key].id,  common.removeBlankExcelData(obj[map[key].name_kor]), unique_key + "_" +  map[key].id]);
            }
            cnt--;
        }

        if (cnt == 0 || (i == data.length-1)) {
            all_arr.push(arr);
            all_sub_arr.push(sub_arr);
            cnt = unit;
            arr = [];
            sub_arr = [];
        }

        //이제 등록
        if (i == data.length-1) {

            for (var j=0;j<all_arr.length; j++) {

                 var sql1 = "INSERT INTO company (name_kor, name_eng, country_id, brn, ceo, established, email, website,"  +
                     " headOfficeNumber, address, fax, main_product, NoOfEmployees, createdAt, create_id, unique_key) VALUES ? " +
                     " ON DUPLICATE KEY UPDATE ceo = VALUES(ceo)," +
                     " established = VALUES(established), email = VALUES(email), website = VALUES(website), " +
                     " headOfficeNumber = VALUES(headOfficeNumber), address = VALUES(address), fax = VALUES(fax), " +
                     " main_product = VALUES(main_product), NoOfEmployees = VALUES(NoOfEmployees), updatedAt = VALUES(createdAt), update_id = VALUES(create_id);";
                que.push(queryExec(sql1, [all_arr[j]]));

                
                var sql2 = " INSERT INTO company_sub (company_id, field_id, value_, unique_key) VALUES ? " +
                  " ON DUPLICATE KEY UPDATE value_ = VALUES(value_);";
                que.push(queryExec(sql2, [all_sub_arr[j]]));

                //데이터 넣기 시작
                if(j == all_arr.length-1) {
                    (async () => {
                        try {
                          Promise
                            .all(que)
                            .then(values => {
                                res.json({ 'msg': '완료되었습니다.' });
                            })
                        } catch (err) {
                            console.log(err)
                            res.status(400).json({ 'status': 400, 'msg': '오류로 중지되었습니다.' });
                        }
                      })()
                }
               
            }
        }
    }

};

 exports.modForm = (req, res) => {

    let model = {};
    
    var company_sql = 'SELECT id, country_id, name_kor, name_eng, ceo, established, email, brn, website, creditRating, cashFlowRating, watchRating, headOfficeNumber, address, ' +
        'fax, main_product, NoOfEmployees, opinion_eng, business_nature, product_group, certification, unique_key FROM company WHERE id =' + parseInt(req.params.id) + ' ORDER BY id DESC; '; // company 조회

    var countries_sql = 'SELECT detailYN FROM countries WHERE id = ?; ';

    var field_sql = 'SELECT id, name_kor, name_eng, field_code, order_ FROM field WHERE useYN = "Y" AND delYN = "N" ORDER BY order_ ASC; '; // 필드 목록
    var certification_sql = 'SELECT id, code FROM certification WHERE useYN = "Y" AND delYN = "N" ORDER BY order_;';
    var rating_sql = 'SELECT type, id, name, subname, contents, color, order_, useYN, createdAt FROM rating WHERE delYN = "N" ORDER BY order_ DESC; ';

    var category_sql ="SELECT e.id AS p1_id, e.category_name AS p1_name, d.id AS p2_id, d.category_name AS p2_name, c.id AS p3_id, c.category_name AS p3_name, b.category_name AS category_name, b.id as id, b.depth as depth" +
        " FROM company_category a LEFT OUTER JOIN category b  ON a.category_id = b.id" +
        " LEFT OUTER JOIN category c ON b.parent_id = c.id" +
        " LEFT OUTER JOIN category d ON c.parent_id = d.id " + 
        " LEFT OUTER JOIN category e ON d.parent_id = e.id  WHERE a.id = ?";

    var sub_sql = "SELECT b.name_kor, b.name_eng, b.field_code, a.value_ FROM company_sub a LEFT OUTER JOIN field b ON a.field_id = b.id WHERE a.company_id = ?";

    var ms_sql = "SELECT shareholder, shares, rateOfStocks FROM company_ms WHERE companyId = ?; ";
    var rc_sql = "SELECT a.relCompanyId, a.companyNm, a.ceo as ceoNm, a.rateOfStocks, b.name_eng, b.ceo FROM company_rc a LEFT OUTER JOIN company b ON a.relCompanyId = b.id WHERE a.companyId = ?; ";
    var msp_sql = "SELECT a.partnerId, a.weight, a.totalAssets, a.totalLiabilities, a.sales, a.operatingIncome, a.companyNm, a.brn as brnNum, a.ceo as ceoNm, b.name_eng, b.ceo, b.brn FROM company_partner a LEFT OUTER JOIN company b ON a.partnerId = b.id WHERE a.companyId = ? AND type = 'msp'; ";
    var mpp_sql = "SELECT a.partnerId, a.weight, a.totalAssets, a.totalLiabilities, a.sales, a.operatingIncome, a.companyNm, a.brn as brnNum, a.ceo as ceoNm, b.name_eng, b.ceo, b.brn FROM company_partner a LEFT OUTER JOIN company b ON a.partnerId = b.id WHERE a.companyId = ? AND type = 'mpp'; ";
    var ssofp_sql = "SELECT title, currentAssets, nonCurrentAssets, totalAssets, currentLiabilities, nonCurrentLiabilities, totalLiabilities, capitalStock, totalEquity FROM company_ssofp WHERE companyId = ?; ";
    var cis_sql = "SELECT title, sales, grossProfit, operatingIncome, nonOperatingIncome, nonOperatingExpense, EBIT, incomeTaxes, netIncome FROM company_cis WHERE companyId = ?; ";
    var sfr_sql = "SELECT title_, growthRateOfTotalAssets, growthRateOfSales, netProfitGrowthRate, profitMargin, ROE, ROIC, debtRatio, EBIT_interestCoverageRatio, TBABPTTA, receivablesTO, inventoryTO, totalAssetTO FROM company_sfr WHERE companyId = ?; ";
    var pr_sql = "SELECT title, value FROM company_pr WHERE companyId = ?; ";
    var sr_sql = "SELECT title, value FROM company_sr WHERE companyId = ?; ";
    var cc_sql = "SELECT title, value FROM company_cc WHERE companyId = ?; ";
    var mv_sql = "SELECT a.relCompanyId, a.companyNm, a.value, b.name_eng FROM company_mv a LEFT OUTER JOIN company b ON a.relCompanyId = b.id WHERE a.companyId = ?; ";
    var for_sql = "SELECT title, value, value2 FROM company_for WHERE companyId = ?; ";
    var es_sql = "SELECT operator, maintenance, supervisor, accountant, sales, logistic, material, quality, r_d, logistic_sales, total FROM company_es WHERE companyId = ?; ";
    
    //결과!
    let company_result = connection2.query(company_sql);
    let countries_result = connection2.query(countries_sql, [company_result[0].country_id]);
    let rating_result = connection2.query(rating_sql);
    let field_result = connection2.query(field_sql);
    let certification_result = connection2.query(certification_sql);
    let category_result = connection2.query(category_sql, [ company_result[0].id ]);
    let sub_result = connection2.query(sub_sql, [ company_result[0].unique_key ]);

    let ms_result = connection2.query(ms_sql, [ company_result[0].id ]);
    let rc_result = connection2.query(rc_sql, [ company_result[0].id ]);
    let msp_result = connection2.query(msp_sql, [ company_result[0].id ]);
    let mpp_result = connection2.query(mpp_sql, [ company_result[0].id ]);
    let ssofp_result = connection2.query(ssofp_sql, [ company_result[0].id ]);
    let cis_result = connection2.query(cis_sql, [ company_result[0].id ]);
    let sfr_result = connection2.query(sfr_sql, [ company_result[0].id ]);
    let pr_result = connection2.query(pr_sql, [ company_result[0].id ]);
    let sr_result = connection2.query(sr_sql, [ company_result[0].id ]);
    let cc_result = connection2.query(cc_sql, [ company_result[0].id ]);
    let mv_result = connection2.query(mv_sql, [ company_result[0].id ]);
    let for_result = connection2.query(for_sql, [ company_result[0].id ]);
    let es_result = connection2.query(es_sql, [ company_result[0].id ]);

    model.company = company_result[0];
    model.detailYN = countries_result[0].detailYN;
    model.fieldList = field_result;
    model.ratingList = rating_result;
    model.certifiList = certification_result;
    model.categoryList = category_result;
    model.subList = sub_result;

    model.ms = ms_result;
    model.rc = rc_result;
    model.msp = msp_result;
    model.mpp = mpp_result;
    model.ssofp = ssofp_result;
    model.cis = cis_result;
    model.sfr = sfr_result;
    model.pr = pr_result;
    model.sr = sr_result;
    model.cc = cc_result;
    model.mv = mv_result;
    model.for = for_result;
    model.es = es_result;
    
    res.render('admin/company/modify', { model: model , userObj: req.cookies.userObj});
};

exports.modify = (req, res) => {
    
    var data = req.body;
    var query = [];
    var company_id = req.params.id;

    var sql2 = 'SELECT id, name_kor, name_eng, field_code, order_ FROM field WHERE useYN = "Y" AND delYN = "N" ORDER BY order_ ASC; '; // 필드 목록
    connection.query(sql2, (err,result) => { 

        //business nature(형태: $번호$번호$)
        var business_nature = data.business_nature;
        var business_nature_txt = "";
        if (business_nature != undefined) {
            if (business_nature.length > 0) {
                for (var i=0; i<business_nature.length; i++) {
                    business_nature_txt += business_nature[i] + '$';
                }
                business_nature_txt = '$' + business_nature_txt;
            }
        }
         
        //product_group(형태: $번호$번호$)
        var product_group = data.product_group;
        var product_group_txt = "";
        if (product_group != undefined) {
            if (product_group.length > 0) {
                for (var i=0; i<product_group.length; i++) {
                    product_group_txt += product_group[i] + '$';
                }
                product_group_txt = '$' + product_group_txt;
            }
        }
    
        //certification(형태: $번호$번호$)
        var certification = data.certification;
        var certification_txt = "";
        if (certification != undefined) {
            if (certification.length > 0) {
                for (var i=0; i<certification.length; i++) {
                    certification_txt += certification[i] + '$';
                }
                certification_txt = '$' + certification_txt;
            }
        }

        //opinion
        var opinion = "";
        if (data.opinion_eng != undefined) {
            opinion = common.replaceAll(data.opinion_eng, /\n/g, "<br>")
        }
       
        //company
        var company = {
            name_eng: data.name_eng, ceo: data.ceo,
            established: data.established, NoOfEmployees: data.NoOfEmployees,
            brn: data.brn, address: data.address,
            headOfficeNumber: data.headOfficeNumber, fax: data.fax,
            email: data.email, website: data.website,
            main_product: data.main_product, creditRating: data.creditRating,
            cashFlowRating: data.cashFlowRating, watchRating: data.watchRating,
            opinion_eng: opinion, product_group: product_group_txt,
            business_nature: business_nature_txt, certification: certification_txt
        }

        //수정날짜변경 체크했으면 
        if(data.chk != undefined && data.chk != 'undefined') {
            company.updatedAt = moment.utc().format(format);
        }



        query.push(connection.beginTransaction());
    
        query.push(queryExec('UPDATE company SET ? WHERE id = ' + company_id, company));

        //sub
        for (key in result) {
            query.push(queryExec('INSERT INTO company_sub VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE value_ = VALUES(value_)', [data.unique_key, result[key].id, data[result[key].field_code], data.unique_key + "_" + result[key].id]));
        }
    
    
        //category
        var cateMap = data.cateMap;
        var cate_arr = [];
        for (var key in cateMap) {
            if (cateMap[key] != '') {
                cate_arr.push([company_id, cateMap[key]]);
            }
        }

        //카테고리 모두 삭제
        query.push(queryExec('DELETE FROM company_category WHERE id = ?', company_id));
        
        //카테고리
        for (var i=0; i<cate_arr.length; i++) {
            query.push(queryExec('INSERT INTO company_category VALUES (?, ?)', cate_arr[i]));
        }
    
        //ms(주요주주현황)
        query.push(queryExec("DELETE FROM company_ms WHERE companyId = ?", company_id)); //우선 삭제
        if (data.ms_value_0 != undefined) {
            for (var i=0; i<data.ms_value_0.length; i++) {
                query.push(queryExec('INSERT INTO company_ms VALUES (?, ?, ?, ?, ?);', [company_id, data.ms_value_0[i], data.ms_value_1[i], common.replaceAll(data.ms_value_2[i],"%",""), i]));
            }
        }
    
        //rc(관계사 현황)
        query.push(queryExec("DELETE FROM company_rc WHERE companyId = ?", company_id)); //우선 삭제
        if (data.rc_value_1 != undefined) {
            for (var i=0; i<data.rc_value_1.length; i++) {
                var relCompanyId = data.rc_company[i];
                if (parseInt(relCompanyId) != 0) {
                    query.push(queryExec('INSERT INTO company_rc VALUES (?, ?, ?, ?, ?, ?); ', [company_id, parseInt(relCompanyId), '', '', common.replaceAll(data.rc_value_2[i],"%",""), i]));
                } else {
                    query.push(queryExec('INSERT INTO company_rc VALUES (?, ?, ?, ?, ?, ?); ', [company_id, 0, data.rc_companyName[i], data.rc_value_1[i], common.replaceAll(data.rc_value_2[i],"%",""), i]));
                }
            }
        }
    
        //msp(관계사 현황)
        var sql = 'INSERT INTO company_partner VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); '
        query.push(queryExec("DELETE FROM company_partner WHERE companyId = ?", company_id)); //우선 삭제
        if (data.msp_value_1 != undefined) {
            for (var i=0; i<data.msp_value_1.length; i++) {
                //check
                var partnerId = data.msp_company[i];
                if (parseInt(partnerId) != 0) {
                    query.push(queryExec(sql, 
                            [company_id, 'msp', parseInt(partnerId), '', '', '', common.replaceAll(data.msp_value_3[i],"%",""), common.replaceAll(data.msp_value_3[i],"%",""), common.replaceAll(common.replaceAll(data.msp_value_4[i],",",""), "-", "0"), 
                            common.replaceAll(common.replaceAll(data.msp_value_5[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.msp_value_6[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.msp_value_7[i],",",""), "-", "0"), i]));
                } else {
                    query.push(queryExec(sql, [company_id, 'msp', 0, data.msp_companyName[i], data.msp_value_1[i], data.msp_value_2[i], common.replaceAll(data.msp_value_3[i],"%",""), common.replaceAll(common.replaceAll(data.msp_value_4[i],",",""), "-", "0"), 
                        common.replaceAll(common.replaceAll(data.msp_value_5[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.msp_value_6[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.msp_value_7[i],",",""), "-", "0"), i]));
                }
            }
        }
    
        //mpp(관계사 현황)
        if (data.mpp_value_1 != undefined) {
            for (var i=0; i<data.mpp_value_1.length; i++) {
                //check
                var partnerId = data.mpp_company[i];
                if (parseInt(partnerId) != 0) {
                    query.push(queryExec(sql, [company_id, 'mpp', parseInt(partnerId), '', '', '', common.replaceAll(data.mpp_value_3[i],"%",""), common.replaceAll(data.mpp_value_3[i],"%",""), 
                        common.replaceAll(common.replaceAll(data.mpp_value_4[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.mpp_value_5[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.mpp_value_6[i],",",""), "-", "0"), 
                        common.replaceAll(common.replaceAll(data.mpp_value_7[i],",",""), "-", "0"), i]));
                } else {
                    query.push(queryExec(sql, [company_id, 'mpp', 0, data.mpp_companyName[i], data.mpp_value_1[i], data.mpp_value_2[i], common.replaceAll(data.mpp_value_3[i],"%",""), 
                        common.replaceAll(common.replaceAll(data.mpp_value_4[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.mpp_value_5[i],",",""), "-", "0"),  common.replaceAll(common.replaceAll(data.mpp_value_6[i],",",""), "-", "0"), 
                        common.replaceAll(common.replaceAll(data.mpp_value_7[i],",",""), "-", "0"), i]));
                }
            }
        }
    
        //ssofp(요약재무상태표)
        query.push(queryExec("DELETE FROM company_ssofp WHERE companyId = ?", company_id)); //우선 삭제
        if (data.ssofp_value_0 != undefined) {
            var sql = 'INSERT INTO company_ssofp VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); '  
            for (var i=0; i<data.ssofp_value_0.length; i++) {
                query.push(queryExec(sql, [company_id, data.ssofp_value_0[i], common.replaceAll(common.replaceAll(data.ssofp_value_1[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_2[i],",",""), "-", "0"), 
                common.replaceAll(common.replaceAll(data.ssofp_value_3[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_4[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_5[i],",",""), "-", "0"),
                common.replaceAll(common.replaceAll(data.ssofp_value_6[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_7[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.ssofp_value_8[i],",",""), "-", "0"), i]));
            }
        }
    
        //cis()
        query.push(queryExec("DELETE FROM company_cis WHERE companyId = ?", company_id)); //우선 삭제
        if (data.cis_value_0 != undefined) {
            var sql = 'INSERT INTO company_cis VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); '  
            for (var i=0; i<data.cis_value_0.length; i++) {
                query.push(queryExec(sql, [company_id, data.cis_value_0[i], common.replaceAll(common.replaceAll(data.cis_value_1[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_2[i],",",""), "-", "0"), 
                common.replaceAll(common.replaceAll(data.cis_value_3[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_4[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_5[i],",",""), "-", "0"),
                common.replaceAll(common.replaceAll(data.cis_value_6[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_7[i],",",""), "-", "0"), common.replaceAll(common.replaceAll(data.cis_value_8[i],",",""), "-", "0"), i]));
            }
        }
    
        //sfr()
        query.push(queryExec("DELETE FROM company_sfr WHERE companyId = ?", company_id)); //우선 삭제
        if (data.sfr_value_0 != undefined) {
            var sql = 'INSERT INTO company_sfr SET ? ;'  
            for (var i=0; i<data.sfr_value_0.length; i++) {
                var obj = {
                    'companyId': company_id, 'title_': common.replaceAll(data.sfr_value_0[i],",",""), 'growthRateOfTotalAssets': common.replaceAll(common.replaceAll(data.sfr_value_1[i],",",""), "-", "0"),
                    'growthRateOfSales': common.replaceAll(common.replaceAll(data.sfr_value_2[i],",",""), "-", "0"), 'netProfitGrowthRate': Number(common.replaceAll(common.replaceAll(data.sfr_value_3[i],",",""), "-", "0")), 'profitMargin': common.replaceAll(common.replaceAll(data.sfr_value_4[i],",",""), "-", "0"), 
                    'ROE': common.replaceAll(common.replaceAll(data.sfr_value_5[i],",",""), "-", "0"), 'ROIC': common.replaceAll(common.replaceAll(data.sfr_value_6[i],",",""), "-", "0"), 'debtRatio': common.replaceAll(common.replaceAll(data.sfr_value_7[i],",",""), "-", "0"),
                    'EBIT_interestCoverageRatio': common.replaceAll(common.replaceAll(data.sfr_value_8[i],",",""), "-", "0"), 'TBABPTTA': common.replaceAll(common.replaceAll(data.sfr_value_9[i],",",""), "-", "0"), 'receivablesTO': common.replaceAll(common.replaceAll(data.sfr_value_10[i],",",""), "-", "0"), 
                    'inventoryTO': common.replaceAll(common.replaceAll(data.sfr_value_11[i],",",""), "-", "0"), 'totalAssetTO': common.replaceAll(common.replaceAll(data.sfr_value_12[i],",",""), "-", "0"), 'order_': i
                }
                query.push(queryExec(sql, obj));
                }
        }
    
        //pr(제품생산비율)
        query.push(queryExec("DELETE FROM company_pr WHERE companyId = ?", company_id)); //우선 삭제
        if (data.pr_value_0 != undefined) {
            for (var i=0; i<data.pr_value_0.length; i++) {
                query.push(queryExec('INSERT INTO company_pr VALUES (?, ?, ?, ?); ', 
                        [company_id, i, data.pr_value_0[i], common.replaceAll(data.pr_value_1[i],"%","")]));
            }
        }
    
        //sr(제품생산비율)
        query.push(queryExec("DELETE FROM company_sr WHERE companyId = ?", company_id)); //우선 삭제
        if (data.sr_value_0 != undefined) {
            for (var i=0; i<data.sr_value_0.length; i++) {
                query.push(queryExec('INSERT INTO company_sr VALUES (?, ?, ?, ?); ', 
                        [company_id, i, data.sr_value_0[i], common.replaceAll(data.sr_value_1[i],"%","")]));
            }
        }
    
        //cc(구성비)
        query.push(queryExec("DELETE FROM company_cc WHERE companyId = ?", company_id)); //우선 삭제
        if (data.cc_value_0 != undefined) {
            for (var i=0; i<data.cc_value_0.length; i++) {
                query.push(queryExec('INSERT INTO company_cc VALUES (?, ?, ?, ?); ', 
                        [company_id, i, data.cc_value_0[i], common.replaceAll(data.cc_value_1[i],"%","")]));
            }
        }
    
        //mv(주요주주현황)
        query.push(queryExec("DELETE FROM company_mv WHERE companyId = ?", company_id)); //우선 삭제
        if (data.mv_value_1 != undefined) {
            for (var i=0; i<data.mv_value_1.length; i++) {
                //check
                var relCompanyId = data.mv_company[i];
                if (parseInt(relCompanyId) != 0) {
                    query.push(queryExec('INSERT INTO company_mv VALUES (?, ?, ?, ?, ?); ', 
                    [company_id, parseInt(relCompanyId), '', common.replaceAll(data.mv_value_1[i],"%",""), i]));
                } else {
                    query.push(queryExec('INSERT INTO company_mv VALUES (?, ?, ?, ?, ?); ', 
                    [company_id, 0, data.mv_companyName[i], common.replaceAll(data.mv_value_1[i],"%",""), i]));
                }
            }
        }
    
        //for(주요주주현황)
        query.push(queryExec("DELETE FROM company_for WHERE companyId = ?", company_id)); //우선 삭제
        if (data.for_value_0 != undefined) {
            for (var i=0; i<data.for_value_0.length; i++) {
                query.push(queryExec('INSERT INTO company_for VALUES (?, ?, ?, ?, ?); ', 
                        [company_id, i, data.for_value_0[i], common.replaceAll(data.for_value_1[i],"%",""), common.replaceAll(data.for_value_2[i],"%","")]));
            } 
        }

        //es(인원현황)
        if (data.es_value_0 != undefined) {
            for (var i=0; i<data.es_value_0.length; i++) {
                query.push(queryExec('INSERT INTO company_es VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE operator = VALUES(operator), maintenance = VALUES(maintenance), supervisor = VALUES(supervisor), accountant = VALUES(accountant), sales = VALUES(sales), logistic = VALUES(logistic), material = VALUES(material), quality = VALUES(quality), r_d = VALUES(r_d), logistic_sales = VALUES(logistic_sales), total = VALUES(total); ', 
                        [company_id, data.es_value_0[i], data.es_value_1[i], data.es_value_2[i], data.es_value_3[i], data.es_value_4[i], data.es_value_5[i], data.es_value_6[i], data.es_value_7[i],
                        data.es_value_8[i], data.es_value_9[i], data.es_value_10[i]]));
            }
        }
    
        //시작,,
        (async () => {
            try {
                Promise
                .all(query)
                .then(values => {
                    connection.commit(function(err) {
                        if (err) { 
                            connection.rollback(function() {
                                throw err;
                            });
                        }
                        res.json({ 'msg': '완료되었습니다.' });
                        });
                })
            } catch (err) {
                console.log(err)
                res.status(400).json({ 'status': 400, 'msg': '오류로 중지되었습니다.' });
            }
            })()
    });      
}
