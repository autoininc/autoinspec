const config = require('../../conf/environments').info;
const common = require('../../public/js/common');
const mysql = require('sync-mysql');
var connection = new mysql(config);
  
//시간 관련
var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';

// 목록 GET
exports.search = (req, res) => {

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

    let countries_result = connection.query(countries_sql);

    //공통 sql
    var join = ' LEFT OUTER JOIN company_category c ON a.id = c.id LEFT OUTER JOIN category d ON c.category_id = d.id ' +
                'LEFT OUTER JOIN category e ON d.parent_id = e.id LEFT OUTER JOIN category f ON e.parent_id = f.id '

    //검색 적용
    var where = "";

    //통합 검색
    if (search_type == 1) 
        where += "  WHERE (name_eng LIKE '%" + search_txt + "%' OR ceo LIKE '%" + search_txt + "%' OR main_product LIKE '%" + search_txt + "%') "
    else if (search_type == 2)
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

    //등록된 기업 개수 쿼리문
    var count_sql = 'SELECT COUNT(DISTINCT a.id) AS cnt FROM company a ' + join + where;
    

    let count_result = connection.query(count_sql);

    var totalCount = Number(count_result[0].cnt); // NOTE: 전체 글 개수.
    var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
    var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
    let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

    //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
    var sql ="SELECT DISTINCT a.id, a.country_id, a.name_kor, a.name_eng, a.main_product, a.address, a.ceo, a.email, a.website, a.creditRating, a.cashFlowRating, a.watchRating, IFNULL(a.opinion_eng, '') as opinion_eng, b.country_name" +
        " FROM company a LEFT OUTER JOIN countries b ON a.country_id = b.id " + join + where + ' ORDER BY a.updatedAt DESC, a.id DESC LIMIT ?,?';

    let rs = connection.query(sql, [skipSize, contentSize]);

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

        let result5 = connection.query(sql5, [ data.id ]);
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
    
    res.render('search/list', {model:result, comma: common.comma, userObj: req.cookies.userObj});
};

exports.detail = (req, res) => {

    let model = {};
    var auth_rm = false;
    var auth_component = false;
    var subscription_member = false;
    var currency_id;
    var currency;
    var coin_result;
    var user = undefined;

    //볼 권한이 있는지 체크
    //rm1 데이터 권한 체크
    if (req.cookies.userObj) {

        //사용자 정보 조회
        var my_sql = 'SELECT * FROM users WHERE id = ' + req.cookies.userObj.id;
        user = connection.query(my_sql); 

        //최초 조회시 최근 조회 테이블에 값 넣기
        if (req.query.first == 1) {
            connection.query('INSERT INTO recently_viewed (userId, companyId, createdAt) VALUES (?, ?, ?); ', [ req.cookies.userObj.id, req.params.id,  moment.utc().format(format)]);
        }

        //관리자니?
        if (req.cookies.userObj.level == 4) {
            auth_rm = true; auth_component = true;

        } else {

            //코인 조회
            var coin_sql = 'SELECT IFNULL(sum(coin), 0) as sum FROM coin WHERE status != 0 AND userId = ' + req.cookies.userObj.id;
            coin_result = connection.query(coin_sql); 

            // 멤바쉽이니?
            let subscription_result = connection.query('SELECT a.start, a.end, b.status FROM subscription a LEFT OUTER JOIN payment b ON a.id = b.itemId WHERE a.userId = ? ORDER BY a.id DESC LIMIT 1; ', [ req.cookies.userObj.id ]);
            if (subscription_result != undefined && subscription_result.length > 0) {
                //대기 전 상황 아니고 취소 상태가 아니라면
                if (subscription_result.length > 0) {
                    if (subscription_result[0].status == 1) {
                        var now = moment.utc().local().format(format);   
                        var finish = moment.utc(subscription_result[0].end).local().format(format);
    
                        var nowTime = new Date(now); 
                        var endTime = new Date(finish);
    
                        var difference_e = endTime.getTime() - nowTime.getTime(); // This will give difference in milliseconds
                        var resultInMinutes = Math.round(difference_e / 60000);
                        //멤버쉽 회원~
                        if (resultInMinutes > 0) {
                            subscription_member = true;
                            auth_rm = true; auth_component = true;
                        }
                    }
                }
            } else {

                //coin으로 샀니?
                let coin_reusult = connection.query('SELECT id, type FROM purchasedproduct WHERE userId = ? AND companyId = ? AND STR_TO_DATE( ?, "%Y-%m-%d %H:%i" ) <= STR_TO_DATE( end, "%Y-%m-%d %H:%i"); ', [ req.cookies.userObj.id, req.params.id, moment.utc().format('YYYY-MM-DD HH:mm') ]);
                if (coin_reusult != undefined) {

                    if (coin_reusult.length > 0) {
                        for (var i=0; i<coin_reusult.length; i++) {

                            //일반 데이터 샀으면
                            if (coin_reusult[i].type == 'D') {
                                auth_rm = true;
                            }
                            //부품 데이터 샀으면
                            if (coin_reusult[i].type == 'C') {
                                auth_component = true;
                            }
                            // 모든 데이터 샀으면
                            if (coin_reusult[i].type == 'A') {
                                auth_rm = true; auth_component = true;
                            }

                        }
                    }
                }
            }
        }
    }

    //currencies 조회
    var currencies_sql = "SELECT id, title, code, symbolNative, decimalPlaces, value, unit, updatedAt, update_id, defaultYN FROM currencies WHERE useYN = 'Y'; ";
    
    var company_sql = 'SELECT a.id, a.name_kor, a.name_eng, a.ceo, a.established, a.brn, a.headOfficeNumber, a.address, a.fax, a.main_product, a.NoOfEmployees, a.opinion_eng, ' +
        'a.business_nature as business_nature, a.product_group, a.unique_key, b.detailYN, a.updatedAt FROM company a LEFT OUTER JOIN countries b ON a.country_id = b.id WHERE a.id =' + parseInt(req.params.id) + ' ORDER BY a.id DESC; '; // company 조회
    
    var field_sql = 'SELECT id, name_kor, name_eng, field_code, order_ FROM field WHERE useYN = "Y" AND delYN = "N" ORDER BY order_ ASC; '; // 필드 목록

    var category_sql ="SELECT e.id AS p1_id, e.category_name AS p1_name, d.id AS p2_id, d.category_name AS p2_name, c.id AS p3_id, c.category_name AS p3_name, b.category_name AS category_name, b.id as id, b.depth as depth" +
        " FROM company_category a LEFT OUTER JOIN category b  ON a.category_id = b.id" +
        " LEFT OUTER JOIN category c ON b.parent_id = c.id" +
        " LEFT OUTER JOIN category d ON c.parent_id = d.id " + 
        " LEFT OUTER JOIN category e ON d.parent_id = e.id  WHERE a.id = ?";
    
    var sub_sql = "SELECT a.field_id, b.name_kor, b.name_eng, b.field_code, a.value_ FROM company_sub a LEFT OUTER JOIN field b ON a.field_id = b.id WHERE a.company_id = ?";
        
    //결과!
    let company_result = connection.query(company_sql);
    let field_result = connection.query(field_sql);
    let category_result = connection.query(category_sql, [ parseInt(req.params.id) ]);
    let sub_result = connection.query(sub_sql, [ company_result[0].unique_key ]);

    // 통화
    let currencies = connection.query(currencies_sql);
    
    //select 박스에서 통화 선택 했다면
    if (req.query.sel_currency_id != '' && req.query.sel_currency_id != undefined) {
        currency_id = req.query.sel_currency_id;
            for (var i=0; i<currencies.length; i++) {
                if (currency_id == currencies[i].id) {
                    currency = currencies[i];
                }
            }
    } else {
        if (user == undefined || user[0].currency == null) {
            for (var i=0; i<currencies.length; i++) {
                if (currencies[i].defaultYN == 'Y') {
                    currency_id = currencies[i].id;
                    currency = currencies[i];
                }
            }
        } else {
            currency_id = user[0].currency;
            for (var i=0; i<currencies.length; i++) {
                if (currency_id == currencies[i].id) {
                    currency = currencies[i];
                }
            }
        }
    }
    
    
    //Business Nature 값 설정
    var business_nature_arr = [];
    var business_nature = company_result[0].business_nature.split('$');
    if (business_nature.length > 0) {
        for (var i=0; i<business_nature.length; i++) {
            if (business_nature[i] != '') {
                if (business_nature[i] == 1) { business_nature_arr.push('Manufacturer') }
                if (business_nature[i] == 2) { business_nature_arr.push('Dealer, agent, distributor, wholesaler') }
                if (business_nature[i] == 3) { business_nature_arr.push('Retailer') }
                if (business_nature[i] == 4) { business_nature_arr.push('Service supplier(Auto refitter / tuner / garage / workshop)') }
                if (business_nature[i] == 5) { business_nature_arr.push('Private & official fleetts') }
                if (business_nature[i] == 6) { business_nature_arr.push('Trade associations/government agencies') }
                if (business_nature[i] == 7) { business_nature_arr.push('Publisher') }
                if (business_nature[i] == 8) { business_nature_arr.push('Research institutions / universities / polytechnic') }
                if (business_nature[i] == 9) { business_nature_arr.push('Others') }
            }
        }
    }

    //product_group 값 설정
    var product_group_arr = [];
    var product_group = company_result[0].product_group.split('$');
    if (product_group.length > 0) {
        for (var i=0; i<product_group.length; i++) {
            if (product_group[i] != '') {
                if (product_group[i] == 1) { product_group_arr.push('Commercial Vehicle') }
                if (product_group[i] == 2) { product_group_arr.push('Passenger Vehicle') }
                if (product_group[i] == 3) { product_group_arr.push('OEM') }
                if (product_group[i] == 4) { product_group_arr.push('Aftermarket') }
            }
        }
    }

    //3. 카테고리
    var cate_array = [];
    if (category_result.length > 0) {
        for (var i=0; i<category_result.length; i++) {
                  
            var p1 = (category_result[i].p1_name != undefined) ? category_result[i].p1_name: '';
            var p2 = (category_result[i].p2_name != undefined) ? category_result[i].p2_name: '';
            var p3 = (category_result[i].p3_name != undefined) ? category_result[i].p3_name: '';
            var parents = "";
            if (p1 != '') parents += (p1 + " > ")
            if (p2 != '') parents += (p2 + " > ")
            if (p3 != '') parents += (p3 + " > ")

            cate_array.push(parents + category_result[i].category_name)
          }
    }

    model.subscription_member = subscription_member;
    model.auth_rm = auth_rm;
    model.auth_component = auth_component;
    model.coin = (coin_result != undefined) ? coin_result[0].sum : 0;

    model.company = company_result[0];
    model.fieldList = field_result;
    model.subList = sub_result;
    model.categoryList = cate_array;

    model.business_nature = business_nature_arr;
    model.product_group = product_group_arr;
    model.currencies = currencies;
    model.currency = currency;
    res.render('search/detail', { model: model, moment: moment, userObj: req.cookies.userObj});
};

exports.detail_before_ = (req, res) => {

    let model = {};
    var coin_result;
    var auth_rm = req.params.auth_rm;
    var auth_component = req.params.auth_component;
    var detailYN = req.params.detailYN;


    //coin조회
    if (req.cookies.userObj != undefined) {
        var coin_sql = 'SELECT IFNULL(sum(coin), 0) as sum FROM coin WHERE status != 0 AND userId = ' + req.cookies.userObj.id;
        coin_result = connection.query(coin_sql); 
    }
    
      
    var sql1 = 'SELECT id, name_eng, email, website, creditRating, cashFlowRating, watchRating, opinion_eng, certification FROM company WHERE id =' + parseInt(req.params.id) ; // company 조회

    var map = { website: false, email: false, creditRating: false,  cashFlowRating: false, watchRating: false, opinion: false, ms: false, rc: false, msp: false, mpp: false, ssofp: false, cis: false, sfr: false,
        pr: false, sr: false, cc: false,  mv: false, for: false, es: false, certification: false};
    

    //2. get 업체 정보 
    let result2 = connection.query(sql1);
    var data = result2[0];

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

    var sql5 ="SELECT DISTINCT a.id, COUNT(b.companyId) as ms, COUNT(c.companyId) as rc, COUNT(d.companyId) as msp, COUNT(e.companyId) as mpp, COUNT(f.companyId) as ssofp, COUNT(g.companyId) as cis, COUNT(h.companyId) as sfr FROM company a" + 
                " LEFT OUTER JOIN company_ms b ON a.id = b.companyId" + 
                " LEFT OUTER JOIN company_rc c ON a.id = c.companyId" +
                " LEFT OUTER JOIN company_partner d ON a.id = d.companyId AND d.type ='msp'" +
                " LEFT OUTER JOIN company_partner e ON a.id = e.companyId AND d.type ='mpp'" +
                " LEFT OUTER JOIN company_ssofp f ON a.id = f.companyId" +
                " LEFT OUTER JOIN company_cis g ON a.id = g.companyId" +
                " LEFT OUTER JOIN company_sfr h ON a.id = h.companyId" +
                " WHERE a.id = ?";

    let result5 = connection.query(sql5, [ data.id ]);
    var data5 = result5[0];
    if (data5.ms > 0) { map['ms'] = true; } 
    if (data5.rc > 0) { map['rc'] = true; } 
    if (data5.msp > 0) { map['msp'] = true; } 
    if (data5.mpp > 0) { map['mpp'] = true; } 
    if (data5.ssofp > 0) { map['ssofp'] = true; } 
    if (data5.cis > 0) { map['cis'] = true; } 
    if (data5.sfr > 0) { map['sfr'] = true; } 

    var sql6 ="SELECT DISTINCT a.id, COUNT(b.companyId) as pr, COUNT(c.companyId) as sr, COUNT(d.companyId) as cc, COUNT(e.companyId) as mv, COUNT(f.companyId) as for_, COUNT(g.companyId) as es FROM company a" + 
                " LEFT OUTER JOIN company_pr b ON a.id = b.companyId" + 
                " LEFT OUTER JOIN company_sr c ON a.id = c.companyId" +
                " LEFT OUTER JOIN company_cc d ON a.id = d.companyId" +
                " LEFT OUTER JOIN company_mv e ON a.id = e.companyId" +
                " LEFT OUTER JOIN company_for f ON a.id = f.companyId" +
                " LEFT OUTER JOIN company_es g ON a.id = g.companyId" +
                " WHERE a.id = ?";

    let result6 = connection.query(sql6, [ req.params.id ]);

    if (result6 != undefined) {
        var data6 = result6[0];
        if (data6.pr > 0) { map['pr'] = true; } 
        if (data6.sr > 0) { map['sr'] = true; } 
        if (data6.cc > 0) { map['cc'] = true; } 
        if (data6.mv > 0) { map['mv'] = true; } 
        if (data6.for_ > 0) { map['for'] = true; } 
        if (data6.es > 0) { map['es'] = true; } 
    }

    model.company = result2[0];
    model.check = map;
    model.coin = (coin_result != undefined) ? coin_result[0].sum : 0;
    model.auth_rm = auth_rm;
    model.auth_component = auth_component;
    model.detailYN = detailYN;
    res.render('search/detail_before copy', { model: model , userObj: req.cookies.userObj});
};

exports.detail_pay = (req, res) => {

    let model = {};
    var website;

    //항목 설명 조회
    let description_result = connection.query('SELECT creditRating, cashFlowRating, watchRating, ms, rc, msp, mpp, ssofp, cis, sfr FROM description;');

    var sql1 = 'SELECT a.id, a.name_eng, a.website, a.email, a.creditRating, a.cashFlowRating, a.watchRating, a.opinion_eng, a.unique_key, b.name as credit_name, b.subname as credit_subname, ' +
    'b.contents as credit_contents, c.name as cashflow_name, c.subname as cashflow_subname, c.contents as cashflow_contents, d.name as watch_name, d.subname as watch_subname, d.contents as watch_contents ' +
    'FROM company a LEFT OUTER JOIN rating b ON a.creditRating = b.id  LEFT OUTER JOIN rating c ON a.cashFlowRating = c.id LEFT OUTER JOIN rating d ON a.watchRating = d.id WHERE a.id =' + parseInt(req.params.id) ; // company 조회 
    
    var rating_sql = 'SELECT type, id, name, color FROM rating WHERE delYN = "N" ORDER BY order_ DESC; ';

    var map = { email: false, creditRating: false,  cashFlowRating: false, watchRating: false, opinion: false, ms: false, rc: false, msp: false, 
                        mpp: false, ssofp: false, cis: false, sfr: false, es: false, et: false, cap: false, for: false};

    var currencies_sql = "SELECT id, title, code, symbolNative, decimalPlaces, value, unit, updatedAt, update_id, defaultYN FROM currencies WHERE id = ? ;";

    var ms_sql = "SELECT shareholder, shares, rateOfStocks FROM company_ms WHERE companyId = ?; ";
    var rc_sql = "SELECT a.relCompanyId, a.companyNm, a.ceo as ceoNm, a.rateOfStocks, b.name_eng, b.ceo FROM company_rc a LEFT OUTER JOIN company b ON a.relCompanyId = b.id WHERE a.companyId = ?; ";
    var msp_sql = "SELECT a.partnerId, a.weight, a.totalAssets, a.totalLiabilities, a.sales, a.operatingIncome, a.companyNm, a.brn as brnNum, a.ceo as ceoNm, b.name_eng, b.ceo, b.brn FROM company_partner a LEFT OUTER JOIN company b ON a.partnerId = b.id WHERE a.companyId = ? AND type = 'msp'; ";
    var mpp_sql = "SELECT a.partnerId, a.weight, a.totalAssets, a.totalLiabilities, a.sales, a.operatingIncome, a.companyNm, a.brn as brnNum, a.ceo as ceoNm, b.name_eng, b.ceo, b.brn FROM company_partner a LEFT OUTER JOIN company b ON a.partnerId = b.id WHERE a.companyId = ? AND type = 'mpp'; ";
    var ssofp_sql = "SELECT title, currentAssets, nonCurrentAssets, totalAssets, currentLiabilities, nonCurrentLiabilities, totalLiabilities, capitalStock, totalEquity FROM company_ssofp WHERE companyId = ?; ";
    var cis_sql = "SELECT title, sales, grossProfit, operatingIncome, nonOperatingIncome, nonOperatingExpense, EBIT, incomeTaxes, netIncome FROM company_cis WHERE companyId = ?; ";
    var sfr_sql = "SELECT title_, growthRateOfTotalAssets, growthRateOfSales, netProfitGrowthRate, profitMargin, ROE, ROIC, debtRatio, EBIT_interestCoverageRatio, TBABPTTA, receivablesTO, inventoryTO, totalAssetTO FROM company_sfr WHERE companyId = ?; ";
        
    //결과!
    let rating_result = connection.query(rating_sql);

    //2. get 업체 정보 
    let result2 = connection.query(sql1);

    //website 주소 변경
    var website = "";
    if (result2[0].website != undefined && result2[0].website != '' && result2[0].website != null) {
        if (result2[0].website.indexOf('http://') == -1 && result2[0].website.indexOf('https://') == -1) {
            website = 'http://' + result2[0].website;
        }
    }

    //종합 의견 값 있는지 체크
    var opinion = result2[0].opinion_eng;
    opinion = common.removeBlankExcelData(opinion)
   
    let currency_result = connection.query(currencies_sql, [ parseInt(req.params.currency_id) ]);
    let ms_result = connection.query(ms_sql, [ parseInt(req.params.id) ]);
    let rc_result = connection.query(rc_sql, [ parseInt(req.params.id) ]);
    let msp_result = connection.query(msp_sql, [ parseInt(req.params.id) ]);
    let mpp_result = connection.query(mpp_sql, [ parseInt(req.params.id) ]);
    let ssofp_result = connection.query(ssofp_sql, [ parseInt(req.params.id) ]);
    let cis_result = connection.query(cis_sql, [ parseInt(req.params.id) ]);
    let sfr_result = connection.query(sfr_sql, [ parseInt(req.params.id) ]);
    
    model.company = result2[0];
    model.description = description_result[0];
    model.check = map;
    model.currency = currency_result[0];
    model.ratingList = rating_result;
    model.website = website;
    model.opinion = opinion;
    model.ms = ms_result;
    model.rc = rc_result;
    model.msp = msp_result;
    model.mpp = mpp_result;
    model.ssofp = ssofp_result;
    model.cis = cis_result;
    model.sfr = sfr_result;
    
    res.render('search/detail_pay', { model: model , comma: common.comma, formatMoney: common.formatMoney, userObj: req.cookies.userObj});
};

exports.detailC_pay = (req, res) => {


    let model = {};

    var map = { pr: false, sr: false,  cc: false, mv: false, for: false, es: false, certification: false };

    //항목 설명 조회
    let description_result = connection.query('SELECT pr, sr, dr, mc, por, es, certification FROM description;');

    var company_sql = 'SELECT id, country_id, name_kor, name_eng, ceo, established, email, brn, website, creditRating, cashFlowRating, watchRating, headOfficeNumber, address, ' +
        'fax, main_product, NoOfEmployees, opinion_eng, business_nature, product_group, certification, unique_key FROM company WHERE id =' + parseInt(req.params.id) + ' ORDER BY id DESC; '; // company 조회

    var certification_sql = 'SELECT id, code FROM certification WHERE useYN = "Y" AND delYN = "N" ORDER BY order_;';

    var pr_sql = "SELECT title, value FROM company_pr WHERE companyId = ?; ";
    var sr_sql = "SELECT title, value FROM company_sr WHERE companyId = ?; ";
    var cc_sql = "SELECT title, value FROM company_cc WHERE companyId = ?; ";
    var mv_sql = "SELECT a.relCompanyId, a.companyNm, a.value, b.name_eng FROM company_mv a LEFT OUTER JOIN company b ON a.relCompanyId = b.id WHERE a.companyId = ?; ";
    var for_sql = "SELECT title, value, value2 FROM company_for WHERE companyId = ?; ";
    var es_sql = "SELECT operator, maintenance, supervisor, accountant, sales, logistic, material, quality, r_d, logistic_sales, total FROM company_es WHERE companyId = ?; ";
    
    //결과!
    let company_result = connection.query(company_sql);
    let certification_result = connection.query(certification_sql);
    let pr_result = connection.query(pr_sql, [ parseInt(req.params.id) ]);
    let sr_result = connection.query(sr_sql, [ parseInt(req.params.id) ]);
    let cc_result = connection.query(cc_sql, [ parseInt(req.params.id) ]);
    let mv_result = connection.query(mv_sql, [ parseInt(req.params.id) ]);
    let for_result = connection.query(for_sql, [ parseInt(req.params.id) ]);
    let es_result = connection.query(es_sql, [ parseInt(req.params.id) ]);
    
    model.company = company_result[0];
    model.description = description_result[0];
    model.description_ = description_result[0];
    model.certifiList = certification_result;
    model.check = map;
    model.pr = pr_result;
    model.sr = sr_result;
    model.cc = cc_result;
    model.mv = mv_result;
    model.for = for_result;
    model.es = es_result;

    res.render('search/detailC_pay', { model: model , userObj: req.cookies.userObj});
};

exports.detailN_pay = (req, res) => {

    let model = {};
    var website;

    var sql1 = 'SELECT id, name_eng, website, email, creditRating, cashFlowRating, watchRating, opinion_eng, unique_key FROM company WHERE id =' + parseInt(req.params.id) + ' ORDER BY id DESC; '; // company 조회


    //결과!

    //2. get 업체 정보 
    let result2 = connection.query(sql1);

    //website 주소 변경
    var website = "";
    if (result2[0].website != undefined && result2[0].website != '' && result2[0].website != null) {
        if (result2[0].website.indexOf('http://') == -1 || result2[0].website.indexOf('https://')) {
            website = 'http://' + result2[0].website;
        }
    }

    model.company = result2[0];
    model.website = website;
    
    res.render('search/detailN_pay', { model: model, userObj: req.cookies.userObj});
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

    let company_result = connection.query(sql1);

    var sql2 = 'SELECT COUNT(*) AS cnt FROM company';

    //검색 적용

    //통합 검색
    if (search_type == 1) 
        sql2 += "  WHERE (name_eng LIKE '%" + search_txt + "%' OR ceo LIKE '%" + search_txt + "%' OR main_product LIKE '%" + search_txt + "%') "
    else if (search_type == 2)
        sql2 += "  WHERE (name_eng LIKE '%" + search_txt + "%' ) "
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

    let count_result = connection.query(sql2);

  
                
                var totalCount = Number(count_result[0].cnt); // NOTE: 전체 글 개수.
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
                    sql += " WHERE (name_eng LIKE '%" + search_txt + "%' ) "
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

                let rs = connection.query(sql, [skipSize, contentSize]);


           
               
                    if (pnEnd > pnTotal) pnEnd = pnTotal; // NOTE: 페이지네이션의 끝 번호가 페이지네이션 전체 카운트보다 높을 경우.
                    const result = {
                        totalCount,
                        pageNum,
                        pnStart,
                        pnEnd,
                        pnTotal,
                        contents: rs,
                        countriesList: company_result
                    };
                        res.render('search/modal', {model:result, userObj: req.cookies.userObj, moment: moment});
};


exports.modalView = (req, res) => {

    let model = {};
    var currency_id;
    var currency;

    //currencies 조회
    var currencies_sql = "SELECT id, title, code, symbolNative, decimalPlaces, value, unit, updatedAt, update_id, defaultYN FROM currencies WHERE useYN = 'Y'; ";

    //항목 설명 조회
    let description_result = connection.query('SELECT creditRating, cashFlowRating, watchRating, ms, rc, msp, mpp, ssofp, cis, sfr, pr, sr, dr, mc, por, es FROM description;');

    //신용등급 조회
    var rating_sql = 'SELECT type, id, name, color FROM rating WHERE delYN = "N" ORDER BY order_ DESC; ';
    
    var company_sql = 'SELECT a.id, a.name_kor, a.name_eng, a.ceo, a.established, a.brn, a.headOfficeNumber, a.address, a.fax, a.main_product, a.NoOfEmployees, a.website, a.email, a.creditRating, a.cashFlowRating, a.watchRating, a.opinion_eng, ' +
        'a.unique_key, a.business_nature as business_nature, a.product_group, a.certification, b.name as credit_name, b.subname as credit_subname, b.contents as credit_contents, c.name as cashflow_name, ' +
        'c.subname as cashflow_subname, c.contents as cashflow_contents, d.name as watch_name, d.subname as watch_subname, d.contents as watch_contents, e.detailYN ' + 
        'FROM company a LEFT OUTER JOIN rating b ON a.creditRating = b.id LEFT OUTER JOIN rating c ON a.cashFlowRating = c.id LEFT OUTER JOIN rating d ON a.watchRating = d.id LEFT OUTER JOIN countries e ON a.country_id = e.id ' +
        'WHERE a.id =' + parseInt(req.params.id) ; // company 조회 

    var field_sql = 'SELECT id, name_kor, name_eng, field_code, order_ FROM field WHERE useYN = "Y" AND delYN = "N" ORDER BY order_ ASC; '; // 필드 목록

    var category_sql ="SELECT e.id AS p1_id, e.category_name AS p1_name, d.id AS p2_id, d.category_name AS p2_name, c.id AS p3_id, c.category_name AS p3_name, b.category_name AS category_name, b.id as id, b.depth as depth" +
        " FROM company_category a LEFT OUTER JOIN category b  ON a.category_id = b.id" +
        " LEFT OUTER JOIN category c ON b.parent_id = c.id" +
        " LEFT OUTER JOIN category d ON c.parent_id = d.id " + 
        " LEFT OUTER JOIN category e ON d.parent_id = e.id  WHERE a.id = ?";
    
    var sub_sql = "SELECT a.field_id, b.name_kor, b.name_eng, b.field_code, a.value_ FROM company_sub a LEFT OUTER JOIN field b ON a.field_id = b.id WHERE a.company_id = ?";
        
    //결과!
    let company_result = connection.query(company_sql);
    let field_result = connection.query(field_sql);
    let category_result = connection.query(category_sql, [ parseInt(req.params.id) ]);
    let sub_result = connection.query(sub_sql, [ company_result[0].unique_key ]);

    // 통화
    let currencies = connection.query(currencies_sql);
    
    //select 박스에서 통화 선택 했다면
    if (req.query.sel_currency_id != '' && req.query.sel_currency_id != undefined) {
        currency_id = req.query.sel_currency_id;
            for (var i=0; i<currencies.length; i++) {
                if (currency_id == currencies[i].id) {
                    currency = currencies[i];
                }
            }
    } else {
        for (var i=0; i<currencies.length; i++) {
            if (currencies[i].defaultYN == 'Y') {
                currency_id = currencies[i].id;
                currency = currencies[i];
            }
        }
    }

    //Business Nature 값 설정
    var business_nature_arr = [];
    var business_nature = company_result[0].business_nature.split('$');
    if (business_nature.length > 0) {
        for (var i=0; i<business_nature.length; i++) {
            if (business_nature[i] != '') {
                if (business_nature[i] == 1) { business_nature_arr.push('Manufacturer') }
                if (business_nature[i] == 2) { business_nature_arr.push('Dealer, agent, distributor, wholesaler') }
                if (business_nature[i] == 3) { business_nature_arr.push('Retailer') }
                if (business_nature[i] == 4) { business_nature_arr.push('Service supplier(Auto refitter / tuner / garage / workshop)') }
                if (business_nature[i] == 5) { business_nature_arr.push('Private & official fleetts') }
                if (business_nature[i] == 6) { business_nature_arr.push('Trade associations/government agencies') }
                if (business_nature[i] == 7) { business_nature_arr.push('Publisher') }
                if (business_nature[i] == 8) { business_nature_arr.push('Research institutions / universities / polytechnic') }
                if (business_nature[i] == 9) { business_nature_arr.push('Others') }
            }
        }
    }

    //product_group 값 설정
    var product_group_arr = [];
    var product_group = company_result[0].product_group.split('$');
    if (product_group.length > 0) {
        for (var i=0; i<product_group.length; i++) {
            if (product_group[i] != '') {
                if (product_group[i] == 1) { product_group_arr.push('Commercial Vehicle') }
                if (product_group[i] == 2) { product_group_arr.push('Passenger Vehicle') }
                if (product_group[i] == 3) { product_group_arr.push('OEM') }
                if (product_group[i] == 4) { product_group_arr.push('Aftermarket') }
            }
        }
    }

    //3. 카테고리
    var cate_array = [];
    if (category_result.length > 0) {
        for (var i=0; i<category_result.length; i++) {
                  
            var p1 = (category_result[i].p1_name != undefined) ? category_result[i].p1_name: '';
            var p2 = (category_result[i].p2_name != undefined) ? category_result[i].p2_name: '';
            var p3 = (category_result[i].p3_name != undefined) ? category_result[i].p3_name: '';
            var parents = "";
            if (p1 != '') parents += (p1 + " > ")
            if (p2 != '') parents += (p2 + " > ")
            if (p3 != '') parents += (p3 + " > ")

            cate_array.push(parents + category_result[i].category_name)
          }
    }


    var website;

    var map = { email: false, creditRating: false,  cashFlowRating: false, watchRating: false, opinion: false, ms: false, rc: false, msp: false, 
                        mpp: false, ssofp: false, cis: false, sfr: false, es: false, et: false, cap: false, for: false, pr: false, sr: false,  cc: false, mv: false, for: false, es: false, certification: false };

    var currencies_sql = "SELECT id, title, code, symbolNative, decimalPlaces, value, unit, updatedAt, update_id, defaultYN FROM currencies WHERE id = ? ;";

    var ms_sql = "SELECT shareholder, shares, rateOfStocks FROM company_ms WHERE companyId = ?; ";
    var rc_sql = "SELECT a.relCompanyId, a.companyNm, a.ceo as ceoNm, a.rateOfStocks, b.name_eng, b.ceo FROM company_rc a LEFT OUTER JOIN company b ON a.relCompanyId = b.id WHERE a.companyId = ?; ";
    var msp_sql = "SELECT a.partnerId, a.weight, a.totalAssets, a.totalLiabilities, a.sales, a.operatingIncome, a.companyNm, a.brn as brnNum, a.ceo as ceoNm, b.name_eng, b.ceo, b.brn FROM company_partner a LEFT OUTER JOIN company b ON a.partnerId = b.id WHERE a.companyId = ? AND type = 'msp'; ";
    var mpp_sql = "SELECT a.partnerId, a.weight, a.totalAssets, a.totalLiabilities, a.sales, a.operatingIncome, a.companyNm, a.brn as brnNum, a.ceo as ceoNm, b.name_eng, b.ceo, b.brn FROM company_partner a LEFT OUTER JOIN company b ON a.partnerId = b.id WHERE a.companyId = ? AND type = 'mpp'; ";
    var ssofp_sql = "SELECT title, currentAssets, nonCurrentAssets, totalAssets, currentLiabilities, nonCurrentLiabilities, totalLiabilities, capitalStock, totalEquity FROM company_ssofp WHERE companyId = ?; ";
    var cis_sql = "SELECT title, sales, grossProfit, operatingIncome, nonOperatingIncome, nonOperatingExpense, EBIT, incomeTaxes, netIncome FROM company_cis WHERE companyId = ?; ";
    var sfr_sql = "SELECT title_, growthRateOfTotalAssets, growthRateOfSales, netProfitGrowthRate, profitMargin, ROE, ROIC, debtRatio, EBIT_interestCoverageRatio, TBABPTTA, receivablesTO, inventoryTO, totalAssetTO FROM company_sfr WHERE companyId = ?; ";
    
    var certification_sql = 'SELECT id, code FROM certification WHERE useYN = "Y" AND delYN = "N" ORDER BY order_;';

    var pr_sql = "SELECT title, value FROM company_pr WHERE companyId = ?; ";
    var sr_sql = "SELECT title, value FROM company_sr WHERE companyId = ?; ";
    var cc_sql = "SELECT title, value FROM company_cc WHERE companyId = ?; ";
    var mv_sql = "SELECT a.relCompanyId, a.companyNm, a.value, b.name_eng FROM company_mv a LEFT OUTER JOIN company b ON a.relCompanyId = b.id WHERE a.companyId = ?; ";
    var for_sql = "SELECT title, value, value2 FROM company_for WHERE companyId = ?; ";
    var es_sql = "SELECT operator, maintenance, supervisor, accountant, sales, logistic, material, quality, r_d, logistic_sales, total FROM company_es WHERE companyId = ?; ";

    //결과!
    let rating_result = connection.query(rating_sql);

    //website 주소 변경
    var website = "";
    if (company_result[0].website != undefined && company_result[0].website != '' && company_result[0].website != null) {
        if (company_result[0].website.indexOf('http://') == -1 && company_result[0].website.indexOf('https://') == -1) {
            website = 'http://' + company_result[0].website;
        }
    }

    //종합 의견 값 있는지 체크
    var opinion = company_result[0].opinion_eng;
    opinion = common.removeBlankExcelData(opinion)
   
    let ms_result = connection.query(ms_sql, [ parseInt(req.params.id) ]);
    let rc_result = connection.query(rc_sql, [ parseInt(req.params.id) ]);
    let msp_result = connection.query(msp_sql, [ parseInt(req.params.id) ]);
    let mpp_result = connection.query(mpp_sql, [ parseInt(req.params.id) ]);
    let ssofp_result = connection.query(ssofp_sql, [ parseInt(req.params.id) ]);
    let cis_result = connection.query(cis_sql, [ parseInt(req.params.id) ]);
    let sfr_result = connection.query(sfr_sql, [ parseInt(req.params.id) ]);
    
    
    //결과!
    let certification_result = connection.query(certification_sql);
    let pr_result = connection.query(pr_sql, [ parseInt(req.params.id) ]);
    let sr_result = connection.query(sr_sql, [ parseInt(req.params.id) ]);
    let cc_result = connection.query(cc_sql, [ parseInt(req.params.id) ]);
    let mv_result = connection.query(mv_sql, [ parseInt(req.params.id) ]);
    let for_result = connection.query(for_sql, [ parseInt(req.params.id) ]);
    let es_result = connection.query(es_sql, [ parseInt(req.params.id) ]);

    model.company = company_result[0];
    model.fieldList = field_result;
    model.subList = sub_result;
    model.categoryList = cate_array;

    model.business_nature = business_nature_arr;
    model.product_group = product_group_arr;
    model.currencies = currencies;
    model.currency = currency;
    
    model.certifiList = certification_result;
    model.check = map;
    model.pr = pr_result;
    model.sr = sr_result;
    model.cc = cc_result;
    model.mv = mv_result;
    model.for = for_result;
    model.es = es_result;

    model.description = description_result[0];
    model.check = map;
    model.ratingList = rating_result;
    model.website = website;
    model.opinion = opinion;
    model.ms = ms_result;
    model.rc = rc_result;
    model.msp = msp_result;
    model.mpp = mpp_result;
    model.ssofp = ssofp_result;
    model.cis = cis_result;
    model.sfr = sfr_result;

    res.render('search/modalView', { model: model, moment: moment, comma: common.comma, formatMoney: common.formatMoney, userObj: req.cookies.userObj});
};