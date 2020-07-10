const config = require('../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../public/js/common');
const fs = require('fs'); 
const mime = require('mime-types');

var bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();

const path = require('path');
const filePath = path.join(__dirname, '../../public/uploads/')

var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';

var nodemailer = require('nodemailer');
var smtpTransporter = require('nodemailer-smtp-transport');

//메일 서버
var smtpTransport = nodemailer.createTransport(smtpTransporter ( {
  service: 'Cafe24',
  host:'smtp.cafe24.com',
  secure: false, 
  port:'587',
  tls: {
    rejectUnauthorized: false,
    ignoreTLS: false,
    requireTLS: true,
    secureProtocol: "TLSv1_method"
  },
  auth:{
      user:'kjh@autoingroup.com',
      pass:'autoin2020', 
  },
  maxConnections:5,
  maxMessages:10

}));


// 내 정보 GET
exports.setting = (req, res) => {

  var userObj = req.cookies.userObj;

  if(!userObj) {
    res.redirect('/');
  }

  var sql = "SELECT * FROM users WHERE id = ?";
  var currencies_sql = "SELECT id, title, code, symbolNative, decimalPlaces, value, unit, updatedAt, update_id, defaultYN FROM currencies WHERE useYN = 'Y'; ";

  var sql_result;
  var currencies_sql_result;

  connection.query(sql, [userObj.id], function(err, results) {

    if(err) console.log(err);
    else {

      sql_result = results[0];

      connection.query(currencies_sql, function(err, results) {

        if(err) console.log(err);
        else {
          currencies_sql_result = results;
          res.render("account/setting", { user: sql_result, currencies: currencies_sql_result, userObj: req.cookies.userObj, moment: moment });
        }
      })
    }
  })
};

// 내 정보 GET
exports.password = (req, res) => {

  var userObj = req.cookies.userObj;

  if(!userObj) {
    res.redirect('/');
  }

  var sql = "SELECT * FROM users WHERE id = ?";

  connection.query(sql, [userObj.id], function(err, results) {
    if(err) console.log(err);
    else {

      res.render("account/password", { user: results[0], userObj: req.cookies.userObj });

    }
  })
};

// 내 정보 GET
exports.changePassword = (req, res) => {

  var userObj = req.cookies.userObj;
  var obj;

  if(!userObj) {
    res.redirect('/');
  }

  var sql = "SELECT * FROM users WHERE id = ?";

  connection.query(sql, [userObj.id], function(err, results) {
    if(err) console.log(err);
    else {

      //현재 비밀번호 CHECK
      hasher(
        { password: req.body.current_password, salt: results[0].salt },
        function (err, pass, salt, hash) {
          if (results[0].password == hash) {

            if (req.body.password != req.body.password_check) {
              obj = { 'state': 2, 'msg': 'Your password and confirmation password do not match.'};
              res.send(obj);
            } else {
              hasher(
                { password: req.body.password },
                function (err, pass, salt, hash) {

                  connection.query(
                    'UPDATE users SET password = ?, salt = ?, updated_at = ? WHERE id = ?',
                    [hash, salt, moment().format('YYMMDDHHmmss'), results[0].id], 
                    function (err, result) {
                      if (err) throw err;
                      else {
                        obj = { 'state': 3, 'msg': 'change your password! please sign in again!'};
                        res.send(obj);
                      }
                  });
                }
              );

            }
            
          } else {
            obj = { 'state': 1, 'msg': 'current password does not match user\'s password'};
            res.send(obj);
          }
        } 
      )
    }

  })
};

// 내 정보 GET
exports.modCurrency = (req, res) => {

  var userObj = req.cookies.userObj;
  var jsonData = req.body;
  var obj;

  if(!userObj) {
    res.redirect('/');
  }

  var sql = "UPDATE users SET currency = ? WHERE id = ?";

  connection.query(sql, [jsonData['currency_id'], userObj.id], function(err, results) {
    if(err) console.log(err);
    else {
        res.status(200).json({ 'msg': "success" });
    }
  }); 

};

exports.purchaseList = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM purchasedproduct WHERE type != "R" AND userId = ' + req.cookies.userObj.id;

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

        connection.query(sql, [req.cookies.userObj.id, skipSize, contentSize], (err,rs) => {   
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
            };
                res.render('account/purchaseList', {model:result, moment: moment, userObj: req.cookies.userObj});
            }
        });
        }
        
    });
};

exports.creditReportList = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM purchasedproduct WHERE type = "R" AND userId = ' + req.cookies.userObj.id;

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

        connection.query(sql, [req.cookies.userObj.id, skipSize, contentSize], (err,rs) => {   
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
            };
                res.render('account/creditReportList', {model:result, moment: moment, userObj: req.cookies.userObj});
            }
        });
        }
        
    });
};

// 구매내역 GET
exports.transactions = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
		return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }
    let session = req.session;

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM coin WHERE userId = ' + req.cookies.userObj.id;

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
        var sql = 'SELECT a.id, a.userId, a.coin, a.status, a.createdAt, a.ppId, b.type, c.id as company_id, c.name_eng FROM coin a LEFT OUTER JOIN purchasedproduct b ON a.ppId = b.id LEFT OUTER JOIN company c ON b.companyId = c.id WHERE a.userId = ? ORDER BY a.id DESC LIMIT ?,?'
        connection.query(sql,[req.cookies.userObj.id, skipSize, contentSize], (err,rs) => {   
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
            };
                res.render('account/transactions', {model:result, moment: moment, userObj: req.cookies.userObj});
            }
        });
        }
        
    });
};

// 목록 GET
exports.payList = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }

  const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
  const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
  const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
  const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

  //나라 목록
  var sql1 = 'SELECT COUNT(*) AS cnt FROM payment WHERE userId = ' + req.cookies.userObj.id;

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
      console.log(sql);
      /*var sql = 'SELECT *, a.id as gg, EXISTS (select * from coin c where c.createdAt > b.createdAt) as item_cnt, IF(a.createdAt < DATE_ADD(STR_TO_DATE( a.createdAt, "%Y-%m-%d %H:%i"), INTERVAL 5 DAY), 1, 0) as isIn, ' +
          'a.createdAt, a.invoiceNo from payment a LEFT OUTER JOIN coin b ON a.itemId = b.id LEFT OUTER JOIN subscription d ON a.itemId = d.id WHERE a.userId = ? ORDER BY a.id DESC LIMIT ?,?'*/
      connection.query(sql,[req.cookies.userObj.id, req.cookies.userObj.id, req.cookies.userObj.id, req.cookies.userObj.id, skipSize, contentSize], (err,rs) => {   
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
              contents: rs
          };
              res.render('account/payList', {model:result, comma: common.comma, userObj: req.cookies.userObj, moment: moment});
          }
      });
      }
      
  });
};


exports.subscriptionList = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }
    let session = req.session;

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //모인 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM subscription WHERE userId = ' + req.cookies.userObj.id;

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
        connection.query(sql,[req.cookies.userObj.id, skipSize, contentSize], (err,rs) => {   
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
            };
                res.render('account/subscription', {model:result, comma: common.comma, moment: moment, session : session, userObj: req.cookies.userObj});
            }
        });
        }
        
    });
};





exports.qnaList = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }

  let session = req.session;

  const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
  const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
  const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
  const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

  //모인 목록
  var sql1 = 'SELECT COUNT(*) AS cnt FROM qna WHERE userId = ' + req.cookies.userObj.id;

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
      connection.query(sql,[req.cookies.userObj.id, skipSize, contentSize], (err,rs) => {   
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
          };
              res.render('account/qna/list', {model:result, session : session, userObj: req.cookies.userObj, moment: moment});
          }
      });
      }
  });
};

exports.qnaView = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }

    connection.query('SELECT a.id, a.userId, a.email, a.type, a.companyId, a.title, a.contents, a.createdAt, a.status, a.path, a.filename, b.name_eng FROM qna a LEFT OUTER JOIN company b ON a.companyId = b.id WHERE a.id=' + req.params.id, (err,rs) => {   
      if (err) {   
          console.log(err);
          res.end();
      } else {

        if (rs[0].status == 1) {
          connection.query('SELECT id, title, contents, path, filename FROM answer WHERE qnaId=' + rs[0].id, (err,result) => {   
            if (err) {   
                console.log(err);
                res.end();
            }
            console.log(result[0])
            res.render("account/qna/view",{data:rs, answerdata: result, userObj: req.cookies.userObj});
          });
        
        } else {
          res.render("account/qna/view",{data:rs, answerdata: null, userObj: req.cookies.userObj});
        }
     }
  });
};

// 목록 GET
exports.qnaAddForm = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }

  res.render('account/qna/add', {userObj: req.cookies.userObj});
};

exports.qnaAdd = (req, res) => {

  var jsonData = req.body;

  sql = 'INSERT INTO qna(userId, email, type, companyId, title, contents, createdAt)VALUES(?, ?, ?, ?, ?, ?, ?)';

  var params = [ req.cookies.userObj.id, jsonData['email'], jsonData['type'], jsonData['companyId'], jsonData['title'], jsonData['contents'], moment.utc().format(format)];
  connection.query(sql,params,function(err, rows, fields) {
      if (err) {
          console.log(err);
      } else {
          res.status(200).json({ 'msg': "success" });
      }
  });

};


exports.download = (req, res) => {

  connection.query('SELECT path, filename FROM qna WHERE id=' + req.params.id, (err,rs) => {   
    if (err) {   
        console.log(err);
        res.end();
    } else {

      var file = filePath + '/' + rs[0].path + rs[0].filename;
    
      var filename = path.basename(file);
      var mimetype = mime.lookup(file);
    
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('Content-type', mimetype);
    
      var filestream = fs.createReadStream(file);
      filestream.pipe(res);
   }
});

  

};

exports.answerDownload = (req, res) => {

  connection.query('SELECT path, filename FROM answer WHERE id=' + req.params.id, (err,rs) => {   
    if (err) {   
        console.log(err);
        res.end();
    } else {

      var file = filePath + '/' + rs[0].path + rs[0].filename;
    
      var filename = path.basename(file);
      var mimetype = mime.lookup(file);
    
      res.setHeader('Content-disposition', 'attachment; filename=' + filename);
      res.setHeader('Content-type', mimetype);
    
      var filestream = fs.createReadStream(file);
      filestream.pipe(res);
   }
});

  

};

exports.qnaModForm = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    //return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
		return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }

  var year = new Date().getFullYear();		// 현재 월 변수에 저장
  var month = new Date().getMonth() + 1;		// 현재 월 변수에 저장

  common.createYearFolder('qna', year);
  common.createMonthFolder('qna', year, month);

  connection.query('SELECT a.id, a.userId, a.email, a.type, a.companyId, a.title, a.contents, a.createdAt, a.status, a.path, a.filename, b.name_eng FROM qna a LEFT OUTER JOIN company b ON a.companyId = b.id WHERE a.id=' + req.params.id, (err,rs) => {   
    if (err) {   
        console.log(err);
        res.end();
    } else {
        res.render("account/qna/modify",{data:rs, convert: common.cvtEscaptedHtmltoNormal, path: 'qna/' + year + '/' + month + '/', userObj: req.cookies.userObj});
    }
  });
};


exports.qnaDelFile = (req, res) => {
    
  var jsonData = req.body;
  var fullpath = filePath + jsonData['path'] + jsonData['filename'];

  fs.unlink(fullpath, function(err){ // fs 모듈을 이용해서 파일 삭제합니다.​
  
      if(err) res.send(err); // 에러 확인
      
      connection.query('UPDATE qna SET path="", filename="" WHERE id = ' + req.params.id, (err) => { 

        if (err) {   
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
  });
};

exports.qnaMod = (req, res) => {

  var contents = req.body.contents;
  contents = contents.replace(/\n/g, "<br>");

  var obj = { email: req.body.email, type: req.body.type, companyId: req.body.companyId, title: req.body.title, contents: contents, updatedAt: moment.utc().format(format) };

    if (req.file != undefined) {
        obj.path = req.body.path;
        obj.filename = req.file.filename;
    } else if (req.file == undefined && req.body.orgpath != undefined) {
      obj.path = req.body.orgpath;
      obj.filename = req.body.filename;
    } else if (req.file == undefined && req.body.orgpath == undefined) {
      obj.path = '';
      obj.filename = '';
    }

    connection.query('UPDATE qna SET ? WHERE id = ' + req.body.id, [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.send("success");
            
        }
    });
};

exports.qnaDel = (req, res) => {
    
  connection.query('DELETE FROM qna WHERE id = ' + req.params.id, (err) => {   
    
      if (err) {   
          console.log(err);
      } else {
          res.status(200).json({ 'msg': "success" });
      }

  });

};