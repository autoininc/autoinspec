const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../../public/js/common');

//시간 관련
var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';

// 목록 GET
exports.list = (req, res) => {

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

    var sql2 = 'SELECT COUNT(*) AS cnt FROM users';
    
    if (search_txt != '') {
        
        if (search_type == 1) 
            sql2 += " WHERE (last_name LIKE '%" + search_txt + "%' OR first_name LIKE '%" + search_txt + "%' OR email LIKE '%" + search_txt + "%') "
        else if (search_type == 2)
            sql2 += " WHERE (last_name LIKE '%" + search_txt + "%' OR first_name LIKE '%" + search_txt + "%') "
        else if (search_type == 3)
            sql2 += " WHERE (email LIKE '%" + search_txt + "%') "
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
                var sql ="SELECT id, last_name, first_name, email, level, createdAt, email_verified, recentlyLogin FROM users";
                if (search_txt != '') {
    
                    if (search_type == 1) 
                        sql += " WHERE (last_name LIKE '%" + search_txt + "%' OR first_name LIKE '%" + search_txt + "%' OR email LIKE '%" + search_txt + "%') "
                    else if (search_type == 2)
                        sql += " WHERE (last_name LIKE '%" + search_txt + "%' OR first_name LIKE '%" + search_txt + "%') "
                    else if (search_type == 3)
                        sql += " WHERE (email LIKE '%" + search_txt + "%') "
                } 

                sql += ' ORDER BY id DESC LIMIT ?,?'
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
                        res.render('admin/user/list', {model:result, moment: moment, userObj: req.cookies.userObj});
                    }
                });
                }
                
            });
        }
    });
};

exports.changeLevel = (req, res) => {

    var jsonData = req.body;
    
    connection.query('UPDATE users SET level = ? WHERE id = ' + req.params.id, jsonData['level'], (err) => {   
        if (err) {   
            console.log(err);
        } else {
            res.send("success");
        }
    });
};

exports.sendCoin = (req, res) => {

    var jsonData = req.body;
    var obj = {
        user_id: req.params.id,
        point: jsonData['coin'],
        status: 1,
        type: 2,
        createdAt: moment.utc().format(format)
      }
    
      connection.query('INSERT INTO point SET ? ', obj, function(err, result) {
        if (err) {   
            console.log(err);
        } else {
            res.send("success");
        }
    });
};

//상세보기
exports.view = (req, res) => {

    var user;
    var subscription = undefined;
    var coin = undefined;

    //사용자 정보
    connection.query('SELECT * FROM users WHERE id=' + req.params.id, (err,rs) => {   

        if (err) {   
            console.log(err);
            res.end();
        } else {

            user = rs;

            //구독정보
            connection.query('SELECT id, status, title, months, price FROM subscription WHERE (status = 1 OR status = 0) AND userId=' + req.params.id, (err, rs) => {   
            if (err) {  
                console.log(err);
                res.end();
            } else {

                subscription = rs;

                //코인정보
                connection.query('SELECT IFNULL(sum(coin), 0) as sum FROM coin WHERE status != 0 AND userId = ' + req.params.id, (err, rs) => {   
                    if (err) {  
                        console.log(err);
                        res.end();
                    } else {
                        coin = rs;
                        res.render("admin/user/view",{data:user, tab: req.query.tab, subscription: subscription, coin: coin, moment: moment, userObj: req.cookies.userObj});
                    }
                });
            }
        });
        }
    });
};

// 조회내역 GET
exports.recently = (req, res) => {
  
    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM recently_viewed WHERE userId = ' + req.params.id;

    //행 개수 구하는 쿼리 실행
    connection.query(sql1, (err,result) => {  //전체 글목록 행 갯수 구하기

        if(err) {
            console.log(err);
            res.end();
        } else {
        
        var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
        var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
        var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
        let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

        //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
        var sql = 'SELECT a.id, a.companyId, a.createdAt, b.name_eng, b.name_kor FROM recently_viewed a LEFT OUTER JOIN company b ON a.companyId = b.id WHERE a.userId = ? ORDER BY a.id DESC LIMIT ?,?'
        connection.query(sql, [req.params.id, skipSize, contentSize], (err,rs) => {   
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
                res.render('admin/user/recently', {model:result, moment: moment, userObj: req.cookies.userObj});
            }
        });
        }
    });
};

//구매내역 (회사정보)
exports.purchase_company = (req, res) => {

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM purchasedproduct WHERE type != "R" AND userId = ' + req.params.id;

    //행 개수 구하는 쿼리 실행
    connection.query(sql1, (err,result) => {  //전체 글목록 행 갯수 구하기

        if(err) {
            console.log(err);
            res.end();
        } else {
        
        var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
        var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
        var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
        let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

        //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
        var sql = 'SELECT a.id, a.start, a.end, a.type, a.createdAt, b.coin, c.id as company_id, c.name_eng FROM purchasedproduct a  LEFT OUTER JOIN coin b ON a.id = b.ppId ' +
                'LEFT OUTER JOIN company c ON a.companyId = c.id WHERE a.type != "R" AND a.userId = ? ORDER BY a.id DESC LIMIT ?,?';

        connection.query(sql, [req.params.id, skipSize, contentSize], (err,rs) => {   
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
                res.render('admin/user/purchase_company', {model:result, moment: moment, userObj: req.cookies.userObj});
            }
        });
        }
        
    });
  };

//구매내역 (신용리포트)
exports.purchase_credit = (req, res) => {
  
    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM purchasedproduct WHERE type = "R" AND userId = ' + req.params.id;

    //행 개수 구하는 쿼리 실행
    connection.query(sql1, (err,result) => {  //전체 글목록 행 갯수 구하기

        if(err) {
            console.log(err);
            res.end();
        } else {
        
        var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
        var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
        var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
        let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

        //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
        var sql = 'SELECT a.id, a.email, a.type, a.status, a.createdAt, b.coin, c.name_eng, d.id as fileId, d.path, d.filename FROM purchasedproduct a  LEFT OUTER JOIN coin b ON a.id = b.ppId ' +
                'LEFT OUTER JOIN company c ON a.companyId = c.id LEFT OUTER JOIN creditreport_file d ON a.id = d.ppId WHERE a.type = "R" AND a.userId = ? ORDER BY a.id DESC LIMIT ?,?';

        connection.query(sql, [req.params.id, skipSize, contentSize], (err,rs) => {   
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
                res.render('admin/user/purchase_credit', {model:result, moment: moment, userObj: req.cookies.userObj});
            }
        });
        }
    });
};

//구독 내역
exports.subscription = (req, res) => {
  
    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM subscription WHERE userId = ' + req.params.id;

    //행 개수 구하는 쿼리 실행
    connection.query(sql1, (err,result) => {  //전체 글목록 행 갯수 구하기

        if(err) {
            console.log(err);
            res.end();
        } else {
        
        var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
        var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
        var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
        let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

        //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
        var sql = 'SELECT * from subscription WHERE userId = ? ORDER BY id DESC LIMIT ?,?'
        connection.query(sql, [req.params.id, skipSize, contentSize], (err,rs) => {   
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
                res.render('admin/user/subscription', {model:result, comma: common.comma, moment: moment, userObj: req.cookies.userObj});
            }
        });
        }
        
    });
};

//코인 내역
exports.coin = (req, res) => {
  
    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM coin WHERE userId = ' + req.params.id;

    //행 개수 구하는 쿼리 실행
    connection.query(sql1, (err,result) => {  //전체 글목록 행 갯수 구하기

        if(err) {
            console.log(err);
            res.end();
        } else {
        
        var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
        var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
        var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
        let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

        //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
        var sql = 'SELECT a.id, a.userId, a.coin, a.status, a.bonusYN, a.createdAt, a.ppId, b.type, c.id as company_id, c.name_eng FROM coin a LEFT OUTER JOIN purchasedproduct b ON a.ppId = b.id LEFT OUTER JOIN company c ON b.companyId = c.id WHERE a.userId = ? ORDER BY a.id DESC LIMIT ?,?'
        connection.query(sql, [req.params.id, skipSize, contentSize], (err,rs) => {   
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
                res.render('admin/user/coin', {model:result, moment: moment, userObj: req.cookies.userObj});
            }
        });
        }
    });
};
  
// 결제 내역
exports.payment = (req, res) => {

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //나라 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM payment WHERE userId = ' + req.params.id;

    //행 개수 구하는 쿼리 실행
    connection.query(sql1, (err,result) => {  //전체 글목록 행 갯수 구하기

        if(err) {
            console.log(err);
            res.end();
        } else {
        
        var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
        var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
        var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
        let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

        //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력

        var sql = '(SELECT a.id, a.userId, a.price, a.method, a.itemType, a.createdAt, a.status, a.itemId, a.acceptedAt, a.canceledAt, b.title, a.path, a.filename, a.invoiceNo,' +
        'EXISTS (SELECT * FROM recently_viewed c WHERE STR_TO_DATE( c.createdAt, "%Y-%m-%d %H:%i" ) >= STR_TO_DATE( b.start, "%Y-%m-%d %H:%i") AND c.userId = ?) as item_cnt, ' +
        'IF(STR_TO_DATE( a.createdAt, "%Y-%m-%d") <= DATE_ADD(STR_TO_DATE( a.createdAt, "%Y-%m-%d"), INTERVAL 14 DAY), 1, 0) as isIn ' +
        'FROM payment a LEFT OUTER JOIN subscription b ON a.itemId = b.id WHERE a.userId = ? AND a.itemType = "S" )' +
        'UNION ' +
        '(SELECT a.id, a.userId, a.price, a.method, a.itemType, a.createdAt, a.status, a.itemId, a.acceptedAt, a.canceledAt, b.coin as title, a.path, a.filename, a.invoiceNo,' +
        'EXISTS (SELECT * FROM coin_detail c WHERE STR_TO_DATE( c.createdAt, "%Y-%m-%d %H:%i") >= STR_TO_DATE( b.startedAt, "%Y-%m-%d %H:%i") AND c.status = 2 AND c.userId = ?) as item_cnt, ' +
        'IF(STR_TO_DATE( b.startedAt, "%Y-%m-%d") <= DATE_ADD(STR_TO_DATE( b.startedAt, "%Y-%m-%d"), INTERVAL 14 DAY), 1, 0) as isIn ' +
        'FROM payment a LEFT OUTER JOIN coin b ON a.itemId = b.id WHERE a.userId = ? AND a.itemType = "C" ) ORDER BY id DESC LIMIT ?,?'

        connection.query(sql, [req.params.id, req.params.id, req.params.id, req.params.id, skipSize, contentSize], (err,rs) => {   
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
                contents: rs
            };
                res.render('admin/user/payment', {model:result, comma: common.comma, userObj: req.cookies.userObj, moment: moment});
            }
        });
        }
        
    });
};

//1:1 내역
exports.qna = (req, res) => {

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM qna WHERE userId = ' + req.params.id;

    //행 개수 구하는 쿼리 실행
    connection.query(sql1, (err,result) => {  //전체 글목록 행 갯수 구하기

        if(err) {
            console.log(err);
            res.end();
        } else {
        
        var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
        var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
        var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
        let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

        //쿼리문 작성, 실행, model영역에 세팅, 포워드 방식으로 boardList화면 출력
        var sql = 'SELECT a.id, a.userId, a.email, a.type, a.title, a.contents, a.createdAt, a.status, a.filename, b.name_eng from qna a LEFT OUTER JOIN company b ON a.companyId = b.id WHERE userId = ? ORDER BY a.id DESC LIMIT ?,?'
        connection.query(sql, [req.params.id, skipSize, contentSize], (err,rs) => {   
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
                res.render('admin/user/qna', {model:result, userObj: req.cookies.userObj, moment: moment});
            }
        });
        }
    });
};
  
  
  