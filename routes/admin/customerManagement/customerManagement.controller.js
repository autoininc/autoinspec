const config = require('../../../conf/environments').info;
const mysql = require('sync-mysql'); //원래 javascript는 비동기인데 sync-mysql로 동기 설정 가능
var connection = new mysql(config);

//오늘 날짜
var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';


exports.list = (req, res) =>
{
    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    var country_id = req.query.country || 0;
    var level_id = req.query.level || 0;
    var search_type = req.query.type || 0;
    var search_txt = req.query.txt || "";
    var where = "";
    var join = "";

    var sql_category_country = 'SELECT id, country_name FROM countries WHERE showYN = "Y" ORDER BY id DESC; ';

    // ALL, COMPANY, MANAGER 검색
    if(search_type == 1) where += " WHERE (name_eng LIKE '%" + search_txt + "%' OR managerName LIKE '%" + search_txt + "%') ";
    else if( search_type == 2)  where += "  WHERE name_eng LIKE '%" + search_txt + "%' "
    else if(search_type == 3 ) where += "  WHERE managerName LIKE '%" + search_txt + "%' ";

    //managerInfo 테이블이랑 join 해야함
    if(country_id != 0) where += " AND country_id =" + parseInt(country_id);

    //level 선택
    if(level_id != 0) where += " AND innerlevel =" + parseInt(level_id);


    //쿼리문이 많이 복잡해보이지만 company, company_innerlevel, managerInfo 테이블에서 값을 가져오는 문장입니다...
    join += "LEFT JOIN company_innerlevel AS L ON L.company_id = C.id "+ "LEFT JOIN managerInfo AS M ON M.company_id = C.id " + "LEFT JOIN countries AS CC ON CC.id = C.country_id";
    var sqlBase = 'SELECT C.id, C.address, C.name_eng, L.innerlevel, M.*, CC.country_name FROM company AS C ' + join;
    var sql_search_list = sqlBase + where + " ORDER BY C.id LIMIT ?,?;";


    //전체 리스트 개수 쿼리문
    var count_sql = 'SELECT COUNT(DISTINCT C.id) AS cnt FROM company C ' + join + where;
    let rowCount = connection.query(count_sql);

    var totalCount = Number(rowCount[0].cnt); // NOTE: 전체 글 개수.
    var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
    var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
    let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.


    let rs_country = connection.query(sql_category_country); //카테고리 등록된 나라 가져오기
    let rs_search_list = connection.query(sql_search_list, [skipSize, contentSize]);

    if (pnEnd > pnTotal) pnEnd = pnTotal; // NOTE: 페이지네이션의 끝 번호가 페이지네이션 전체 카운트보다 높을 경우.
    const result = {
        totalCount,
        pageNum,
        pnStart,
        pnEnd,
        pnTotal,
        contents: rs_search_list,
        countriesList: rs_country
    };

    res.render('admin/customerManagement/list',{model: result, userObj: req.cookies.userObj});
};


exports.consultForm = (req, res) =>
{
    //수정해야할 부분
    // 회사 id를 기반으로 상담 내용 리스트 가져오기
    let model_consult = {};
    var company_id = req.query.id;

    var sql_getCompanyInfo = 'SELECT * from managerInfo where company_id = ' +company_id; //담당자 정보 가져오기
    var sql_getConsultList = 'SELECT * from consult WHERE company_id = '+company_id; //상담 내용 전부 가져오기
    var sql_getConsultName = 'SELECT last_name, first_name from users where id = ' //상담자 이름 DB에서 가져오기
    var sql_getInnerlevel = 'SELECT innerlevel from company_innerlevel where company_id = ' + company_id;
    var myname = req.cookies.userObj.id;

    sql_getConsultName = sql_getConsultName + myname + ';';
    model_consult.list = connection.query(sql_getConsultList); //상담내용 가져오기
    model_consult.name = connection.query(sql_getConsultName, [myname]); //상담자 이름 가져오기
    model_consult.manager = connection.query(sql_getCompanyInfo); //상담자 정보 가져오기
    let inlevel = connection.query(sql_getInnerlevel);

    res.render('admin/customerManagement/consultingView', {model_consult:model_consult, company_id: company_id, innerlevel:inlevel, userObj: req.cookies.userObj});
};

//상담 정보 추가
//상담 내용 및 비고 json에서 읽어온 후 MySQL에 추가하기
exports.add = (req, res) =>
{
    var jsondata = req.body;

    //company_id 추가해야함
    var sqlS = 'INSERT INTO consult (company_id, conselor, content, remark, consult_date) VALUES(?,?,?,?,?);';
    var sqlL = 'INSERT INTO company_innerlevel (company_id, innerlevel) VALUES (?,?);';

    var params = [jsondata['inCompanyid'], jsondata['inName'], jsondata['inContent'], jsondata['inRemark'], moment.utc().format(format)];
    var paramsL = [jsondata['inCompanyid'], jsondata['inInnerlevel']];

    connection.query(sqlS,params);
    connection.query(sqlL,paramsL);

    res.json({ 'msg': '등록이 완료되었습니다!' });
};

//상담 정보 get
//수정 버튼 클릭 시 상담 내용 가져오기
exports.getdata = (req, res) =>
{
    var jsonData = req.body;
    var id = jsonData['id'];
    var results;

    var sql = 'SELECT * FROM consult WHERE id = ?';
    results = connection.query(sql,[id]);

    res.status(200).json({ 'data': results });
}

//상담 정보 수정
//내용 수정 후 수정 버튼 클릭 시 상담내용 업데이트
exports.modify = (req, res) =>
{
    var jsonData = req.body;
    var sql = 'UPDATE consult SET content = ?, remark = ?, consult_date = ? WHERE id = ?';
    var sqlL = 'UPDATE company_innerlevel SET innerlevel = ? WHERE company_id = ?';

    connection.query(sql, [jsonData['content'], jsonData['remark'], jsonData['id'], moment.utc().format(format)]);
    connection.query(sqlL, [jsonData['innerlevel'], jsonData['company_id']]);

    res.status(200).json({ 'msg': "수정되었습니다" });
}

//상담 정보 삭제
//삭제 버튼 클릭 시 해당 상담 내용 삭제
exports.delete = (req, res) => {
    var jsonData = req.body;
    var sql = 'DELETE FROM consult WHERE id = ?';
    connection.query(sql, [jsonData['id']]);
    res.status(200).json({'msg': "삭제되었습니다"});
}


//담당자 정보 수정
//확인 버튼 클릭 시 내용 업데이트
exports.modifyManager = (req,res) =>
{
    var jsonData = req.body;

    var sql = 'UPDATE managerInfo SET managerName = ?, managerPosition=?, managerDept = ?, managerEmail = ?, managerPhone = ? WHERE company_id = ?;';
    connection.query(sql, [jsonData['managername'], jsonData['managerposition'],jsonData['managerdept'], jsonData['manageremail'], jsonData['managerphone'], jsonData['companyid']]);
    res.status(200).json({ 'msg': "수정되었습니다" });
}

//담당자 정보 추가
//추가 버튼 클릭시 내용 추가
exports.addManager = (req,res) =>
{
    var jsonData = req.body;

    var sqlS = 'INSERT INTO managerInfo (company_id, managerName, managerPosition, managerDept, managerEmail, managerPhone) VALUES(?,?,?,?,?,?);';
    var params = [jsonData['companyid'], jsonData['managername'], jsonData['managerposition'],jsonData['managerdept'], jsonData['manageremail'], jsonData['managerphone']];

    connection.query(sqlS ,params);
    res.json({ 'msg': '등록되었습니다!' });
}
