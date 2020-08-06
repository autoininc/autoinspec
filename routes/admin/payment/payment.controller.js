const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../../public/js/common');

//시간 관련
var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';


const queryExec = (sql, v) => new Promise ((resolve, reject) => {
    connection.query(sql, v, function (err, res) {
        if (err) {
            console.log(err)
        } else {
            resolve(res) // reject는 예외 처리를 할 때 사용합니다.
        }
    })
});

// SUBSCRIPTION 항목 관리 리스트
exports.subscriptionitem = (req, res) => {

    let model = {};
    
    connection.query('SELECT id, name, description, price, months, order_, showYN FROM subscription_item WHERE delYN = "N" ORDER BY order_ ;', (err,rs) => {   
        if(err){   
            console.log(err);
            res.end();
        }else{
            model.list = rs;
            res.render('admin/payment/subscriptionitem/list', {model:model, userObj: req.cookies.userObj});
        }
    });
};

// subscription item 등록폼 GET
exports.subscriptionitem_addForm = (req, res) => {
    res.render("admin/payment/subscriptionitem/add",{userObj: req.cookies.userObj});
};

// subscription item 등록 POST
exports.subscriptionitem_add = (req, res) => {

    var jsonData = req.body;
    console.log(jsonData)

    var order = 1;


    var sql = 'SELECT * FROM subscription_item WHERE showYN = "Y" ORDER BY order_ DESC limit 1';	
    connection.query(sql, function(err,results) {
        
        if (err) {
            console.log(err);
        } else {
            if (results.length == 1) {
                order = results[0].order_ + 1;
            } 

                sql = 'INSERT INTO subscription_item(name, description, price, months, order_, createdAt)VALUES(?, ?, ?, ?, ?, ?)';

                var params = [jsonData['name'], jsonData['description'], jsonData['price'], jsonData['months'], order, moment.utc().format(format)];
                connection.query(sql,params,function(err,rows,fields) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.status(200).json({ 'msg': "success" });
                    }
                });
            }    
    });      
};

// SUBSCRIPTION modForm GET
exports.subscriptionitem_modForm = (req, res) => {

    connection.query('SELECT id, name, description, price, months, showYN FROM subscription_item WHERE id=' + req.params.id, (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("admin/payment/subscriptionitem/mod",{data:rs, userObj: req.cookies.userObj});
        }
    });
};

// SUBSCRIPTION mod POST
exports.subscriptionitem_mod = (req, res) => {

    var jsonData = req.body;
    console.log(jsonData)
    
    var obj = { name: jsonData['name'], description: jsonData['description'], price: jsonData['price'], months: jsonData['months'], showYN: jsonData['showYN'] };

    connection.query('UPDATE subscription_item SET ? WHERE id = ' + req.params.id, [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.status(400).json({ 'msg': "error" });
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};

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

// COIN 항목 관리 리스트
exports.coinitem = (req, res) => {

    let model = {};
    
    connection.query('SELECT id, coin, price order_, showYN FROM coin_item WHERE delYN = "N" ORDER BY order_ ;', (err,rs) => {   
        if(err){   
            console.log(err);
            res.end();
        }else{
            model.list = rs;
            res.render('admin/payment/coinitem', {model:model, userObj: req.cookies.userObj});
        }
    });
};

// SUBSCRIPTION modForm GET
exports.wireTransfer_setting = (req, res) => {

    connection.query('SELECT companyAddress, beneficiary, bank, accountNo, swiftCode, bankTelephone, bankAddress, othersBeneficiaryTel, beneficiaryAddress, branchOfBank, note1, note2, note3, note4, note5 FROM wireTransfer_setting', (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("admin/payment/wireTransfer_setting",{data:rs, convert: common.cvtEscaptedHtmltoNormal, userObj: req.cookies.userObj});
        }
    });
};

// modForm GET
exports.modWireTransfer_setting = (req, res) => {

    var jsonData = req.body;
    
    var obj = { companyAddress: jsonData['companyAddress'], beneficiary: jsonData['beneficiary'], bank: jsonData['bank'], accountNo: jsonData['accountNo'], swiftCode: jsonData['swiftCode'], 
        bankTelephone: jsonData['bankTelephone'], bankAddress: jsonData['bankAddress'], othersBeneficiaryTel: jsonData['othersBeneficiaryTel'], othersBeneficiaryTel: jsonData['othersBeneficiaryTel'], 
        beneficiaryAddress: jsonData['beneficiaryAddress'], branchOfBank: jsonData['branchOfBank'], note1: jsonData['note1'], note2: jsonData['note2'], note3: jsonData['note3'], note4: jsonData['note4'], note5: jsonData['note5'] };

    connection.query('UPDATE wireTransfer_setting SET ?', [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.status(400).json({ 'msg': "error" });
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};

// 목록 GET
exports.list = (req, res) => {

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.
    var status = (req.query.status == null) ? '':req.query.status;
    var count;
    var waitingcnt;

    //나라 목록
    var sql1 = 'SELECT COUNT(*) as cnt, COUNT(IF (status = 0, id, null)) as waiting, COUNT(IF (status = 1, id, null)) as complete, COUNT(IF (status = 2, id, null)) as request, COUNT(IF (status = 3, id, null)) as cancel FROM payment'

    connection.query(sql1, (err,result) => { 
        if(err) {
            console.log(err);
            res.end();
        }
        count = result[0];

        var sql2 = 'SELECT COUNT(*) AS cnt FROM payment ';
        if (status != '') {
            sql2 += 'WHERE status = ' + status;
        }

        connection.query(sql2, [status],(err,result) => {

            if(err) {
                console.log(err);
                res.end();
            } else {

                var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
                var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
                var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
                let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

                var sql = '(SELECT a.id, a.userId, a.price, a.method, a.itemType, a.createdAt, a.status, a.itemId, a.acceptedAt, a.canceledAt, b.title, c.email, a.path, a.filename ' +
                'FROM payment a LEFT OUTER JOIN subscription b ON a.itemId = b.id LEFT OUTER JOIN users c ON a.userId = c.id WHERE a.itemType = "S" ';
                if (status != '') {
                    sql += 'AND a.status = ' + status + ' )' ;
                } else {
                    sql += ' ) ';
                }
                sql += 'UNION ';
                sql += '(SELECT a.id, a.userId, a.price, a.method, a.itemType, a.createdAt, a.status, a.itemId, a.acceptedAt, a.canceledAt, b.coin as title, c.email, a.path, a.filename '
                sql += 'FROM payment a LEFT OUTER JOIN coin b ON a.itemId = b.id LEFT OUTER JOIN users c ON a.userId = c.id WHERE a.itemType = "C" '
                if (status != '') {
                    sql += 'AND a.status = ' + status + ' )' ;
                } else {
                    sql += ' ) ';
                }
                sql += 'ORDER BY id DESC LIMIT ?,?';

                //행 개수 구하는 쿼리 실행
                connection.query(sql,[skipSize, contentSize], (err,rs) => {   
    
                    if(err) {
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
                            cnt: count
                        };


                        res.render('admin/payment/payList', {model:result, comma: common.comma, moment: moment, userObj: req.cookies.userObj});
                    }
                });
            }
                    
                });
    });
   
    
};

// 목록 GET
exports.waitingList = (req, res) => {

    // if (req.cookies.userObj.level != 4) {
    //     res.redirect('/');
    // }

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.
    var countriesList;
    var search_type = req.query.search_type || 1;
    var search_txt = req.query.search_txt || "";

    //나라 목록
    var sql1 = 'SELECT id, country_name FROM countries ' +
        ' WHERE showYN = "Y" ORDER BY id DESC; '

    var sql2 = 'SELECT COUNT(*) AS cnt FROM payment WHERE status = 2';
    
    // if (search_txt != '') {
        
    //     if (search_type == 1) 
    //         sql2 += " WHERE (last_name LIKE '%" + search_txt + "%' OR first_name LIKE '%" + search_txt + "%' OR email LIKE '%" + search_txt + "%') "
    //     else if (search_type == 2)
    //         sql2 += " WHERE (last_name LIKE '%" + search_txt + "%' OR first_name LIKE '%" + search_txt + "%') "
    //     else if (search_type == 3)
    //         sql2 += " WHERE (email LIKE '%" + search_txt + "%') "
    // } 

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
                var sql ="SELECT a.id, a.itemType, a.itemId, a.remitterName, a.email, a.contactName, a.companyName, a.country, a.phone, a.price, a.status, a.method, a.createdAt, a.acceptedAt, b.email, c.coin FROM payment a LEFT OUTER JOIN users b ON a.userId = b.id" + 
                " LEFT OUTER JOIN coin c ON a.itemId = c.id WHERE a.method = '02'";
                // if (search_txt != '') {
    
                //     if (search_type == 1) 
                //         sql += " WHERE (last_name LIKE '%" + search_txt + "%' OR first_name LIKE '%" + search_txt + "%' OR email LIKE '%" + search_txt + "%') "
                //     else if (search_type == 2)
                //         sql += " WHERE (last_name LIKE '%" + search_txt + "%' OR first_name LIKE '%" + search_txt + "%') "
                //     else if (search_type == 3)
                //         sql += " WHERE (email LIKE '%" + search_txt + "%') "
                // } 

                sql += ' ORDER BY a.id DESC LIMIT ?,?'
                connection.query(sql,[skipSize, contentSize], (err,rs) => {   
                    if(err){   
                        console.log(err);
                        res.end();
                    } else {
                        console.log(rs)
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
                        res.render('admin/payment/waitingList', {model:result, moment: moment, userObj: req.cookies.userObj});
                    }
                });
                }
                
            });
        }
    });
};

exports.changeStatus = (req, res) => {

    var jsonData = req.body;
    
    connection.query('UPDATE payment SET status = 1, acceptedAt = ? WHERE id = ' + req.params.id, [moment.utc().format(format)], (err) => {   
        if (err) {   
            console.log(err);
        } else {
            res.send("success");
        }
    });
};

