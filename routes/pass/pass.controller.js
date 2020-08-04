const config = require('../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../public/js/common');
const pdf = require('../../public/js/wireTransferInvoice');
const path = require('path');
const filePath = path.join(__dirname, '../../public')
var PdfPrinter = require('pdfmake');
const header_mail = require('../../public/js/mail_template/header');
const footer_mail = require('../../public/js/mail_template/footer');
const content_html = require('../../public/js/mail_template/wireTransfer_content');

// Define font files
var fonts = {
  Roboto: {
    normal: filePath + '/fonts/Roboto-Regular.ttf',
    bold: filePath + '/fonts/Roboto-Medium.ttf',
    italics: filePath + '/fonts/Roboto-Italic.ttf',
    bolditalics: filePath + '/fonts/Roboto-MediumItalic.ttf'
  }
};


var printer = new PdfPrinter(fonts);
var fs = require('fs');

//페이팔 관련
var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'live', //sandbox or live
  'client_id': 'AVTGoMn8H9F9YqVPP8EshG1M6L0BhU9zNHWfQF9u0FdJa6PTakC1b5kwlfk77cUz81s5_QxbLz1SxFc0',
  'client_secret': 'EFAxbYLydZBVLTWyma0PRc3qZX0n2-NqOcOv8xp_gLQcM1ayqlcCKYhYydeRKqHd5cpKdA9Tz7gnQ-ol'
});

var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';

//메일 관련
var nodemailer = require('nodemailer');
var smtpTransporter = require('nodemailer-smtp-transport');

//메일 서버
var smtpTransport = nodemailer.createTransport(smtpTransporter ( {
    service: 'Lineworks',
    host:'smtp.worksmobile.com',
    secure: true,
    port:'465',
    tls: {
        rejectUnauthorized: false,
        ignoreTLS: false,
        requireTLS: true,
        secureProtocol: "TLSv1_method"
    },
    auth:{
        user:'service@autoingroup.com',
        pass:'autoin2020$',
    }
}));

const queryExec = (sql, v) => new Promise ((resolve, reject) => {
  connection.query(sql, v, function (err, res) {
      if (err) {
          console.log(err)
      } else {
          resolve(res) // reject는 예외 처리를 할 때 사용합니다.
      }
  })
});

// 멤버쉽뷰 GET
exports.index = (req, res) => {

  let session = req.session;
  res.render("pass/index", {

    session : session,
    'userObj': req.cookies.userObj,
  });
};

// 멤버쉽 결제 method 선택 창 POST
exports.selMethod = (req, res) => {

  //subscription 항목들
    var cur = 0;
  var map = {};
  map['group_000'] = { title: 'For a month',   months: 1,  price: '299' };
  map['group_001'] = { title: 'For 3 months',  months: 3,  price: '799' };
  map['group_003'] = { title: 'For 6 months',  months: 6,  price: '1499' };
  map['group_004'] = { title: 'For 12 months', months: 12, price: '2499' };

  //날짜 세팅
  var period_format = 'YYYY-MM-DD HH:mm';
  var start = moment.utc().format(period_format);
  var end = moment().add(map[req.body.pass_num].months, 'months').utc().format(period_format);

  let session = req.session;

  //통화별로 가격 수정 필요
  connection.query('SELECT value FROM currencies WHERE defaultYN=' + '\'Y\';', (err,rs) => {
        if (err) {
            console.log(err);
            res.end();
        } else {
            cur = rs[0].value;
            res.render("pass/selMethod", {
                session : session,
                userObj: req.cookies.userObj,
                subscriptionKey: req.body.pass_num,
                data: map[req.body.pass_num],
                start: start,
                end: end,
                moment: moment,
                comma: common.comma,
                currency: cur
            });
        }
    });


};

// 멤버쉽 결제 확인 창 POST
exports.transferCreate = (req, res) => {

  //wire transfer 세팅 정보 가져오기
  var map = {};
  map['group_000'] = { title: 'For a month',   months: 1,  price: '299' };
  map['group_001'] = { title: 'For 3 months',  months: 3,  price: '799' };
  map['group_003'] = { title: 'For 6 months',  months: 6,  price: '1499' };
  map['group_004'] = { title: 'For 12 months', months: 12, price: '2499' };

  var setting;

  let session = req.session;

  connection.query('SELECT companyAddress, beneficiary, bank, accountNo, swiftCode, bankTelephone, bankAddress, othersBeneficiaryTel, beneficiaryAddress, branchOfBank, note1, note2, note3, note4, note5 FROM wireTransfer_setting', (err,rs) => {   
      if (err) {   
          console.log(err);
          res.end();
      } else {
          
        setting = rs[0];

        res.render("pass/payment_wt", {
          setting: setting,
          convert: common.cvtEscaptedHtmltoNormal, 
          session : session,
          'userObj': req.cookies.userObj,
          subscriptionKey: req.body.subscriptionKey,
          data: map[req.body.subscriptionKey],
          method: req.body.method,
          moment: moment,
          comma: common.comma
        });
      }
  });
};

//wiretransfer - 결제 성공시
exports.processWireTransfer = function(req, res) {

  var year = new Date().getFullYear();		// 현재 월 변수에 저장
  var month = new Date().getMonth() + 1;		// 현재 월 변수에 저장

  common.createYearFolder('invoice', year);
  common.createMonthFolder('invoice', year, month);

  var invoiceDate = moment.utc().local().format('YYYY-MM-DD');
  var invoiceNo = 'P' + moment.utc().local().format('YYMMDD') + common.makeNo(10);
  var createdAt = moment.utc().format(format);

  var setting;

  connection.query('SELECT companyAddress, beneficiary, bank, accountNo, swiftCode, bankTelephone, bankAddress, othersBeneficiaryTel, beneficiaryAddress, branchOfBank, note1, note2, note3, note4, note5 FROM wireTransfer_setting', (err,rs) => {   
    if (err) {   
        console.log(err);
        res.end();
    } else {
        
      setting = rs[0];

      //성공시
      //트랜잭션 시작,,
      connection.beginTransaction(function(err) {
        if (err) { throw err; }

        var obj = {
          userId: req.cookies.userObj.id,
          title: req.body.title,
          months: parseInt(req.body.months),
          price: req.body.price,
          status: 0,
          createdAt: createdAt
      }
      connection.query('INSERT INTO subscription SET ? ', obj, function(err, result) {

        if (err) { 
          console.log(err)
          connection.rollback(function() {
            throw err;
          });
        }
    
        var item_id = result.insertId;
        var obj2 = {
          userId: req.cookies.userObj.id,
          price: req.body.price, 
          method: req.body.method, 
          status: 0, 
          itemType: 'S',
          itemId: item_id,
          remitterName: req.body.remitterName,
          email: req.body.email,
          contactName: req.body.contactName,
          companyName: req.body.companyName,
          country: req.body.country,
          phone: req.body.phone,
          invoiceNo: invoiceNo,
          path: 'invoice/' + year + '/' + month + '/',
          filename: invoiceNo + '.pdf',
          createdAt: createdAt,
        }
        
        connection.query('INSERT INTO payment SET ? ', obj2, function(err, result) {

          if (err) { 
            connection.rollback(function() {
              throw err;
            });
          }  
          connection.commit(function(err) {
            if (err) { 
              connection.rollback(function() {
                throw err;
              });
            }

            
              req.body.createdAt = invoiceDate;
              req.body.logo = path.join(filePath, '/img/pdf_icon.png')
              req.body.type = 'Subscription fee';
              req.body.invoiceNo = invoiceNo;

              //req.body.months = '12'
              
              var pdfDoc = printer.createPdfKitDocument(pdf.getData(setting, req.body));
                pdfDoc.pipe(fs.createWriteStream(filePath + '/uploads/invoice/' + year + '/' + month + '/' +  invoiceNo + '.pdf')).on('finish',function(){

                //메일 옵션
                var mailOpt = {
                  from: 'autoinspec@autoinspec.com',
                  to: req.body.email,
                  subject: '[AUTOINSPEC] Wire Transfer',
                  html: header_mail.getData(req.protocol + '://' + req.headers.host) + content_html.getData()
                    + footer_mail.getData(req.protocol + '://' + req.headers.host),
                  attachments: [{
                    filename: invoiceNo + '.pdf',
                    path: filePath + '/uploads/invoice/' + year + '/' + month + '/' + invoiceNo + '.pdf',
                    contentType: 'application/pdf'
                  }],
                };

                  //전송
                  smtpTransport.sendMail(mailOpt, function(err, res) {
                    if (err) {
                        console.log(err);
                    } else {
                            console.log('email has been sent.');
                    }
                    smtpTransport.close();
                });
                //success
                res.send('<script>alert("Payment Notice will be provide your e-mail to your bank as needed."); opener.location.reload(true); self.close(); </script>');
                 
              });
                pdfDoc.end();
              
            });
          });
        });
      });
    }
});

};


//paypal_subscription
exports.paypalCreate = function (req, res) {

  //paypal method방법(credit_card or paypal)
  var subscriptionKey = req.body.subscriptionKey;
  var title = req.body.title;
  var start = req.body.start;
  var end = req.body.end;
  var months = req.body.months;
  var method = req.body.method;
  var price = req.body.price;
  

  //내용 설정
  var create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": 'paypal'
      },
      "redirect_urls": {
          "return_url": encodeURI('https://' + req.headers.host + '/pass/success?method=' + method + '&title=' + title + '&start=' + start + '&end=' + end + '&months=' + months + '&price=' + price),
          "cancel_url": 'https://' + req.headers.host + '/pass/membership'
          //"return_url": encodeURI('http://' + req.headers.host + '/pass/success?method=' + method + '&title=' + title + '&start=' + start + '&end=' + end + '&months=' + months + '&price=' + price),
          //"cancel_url": 'http://' + req.headers.host + '/pass/membership'
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": title,
                  "sku": '-',
                  "price": price,
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": price
          },
          "description": "This is the payment description."
      }]
  };

  //페이팔 결제 생성
  paypal.payment.create(create_payment_json, function (error, payment) {

    if (error) {
      console.log(error.response.details);
    } else {

      for(let i = 0;i < payment.links.length;i++){

        //승인된다면
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
};

//결제 성공시
exports.success = function(req, res) {

  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": req.query.price
        }
    }]
  };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      //console.log(payment.state == "appoved") 
      if (error) {
          console.log(error.response.details);
          throw error;
      } else {

        //성공시
        //트랜잭션 시작,,
        connection.beginTransaction(function(err) {
          if (err) { throw err; }

          var obj = {
            userId: req.cookies.userObj.id,
            title: req.query.title,
            start: req.query.start,
            end: req.query.end,
            months: parseInt(req.query.months),
            price: req.query.price,
            createdAt: moment.utc().format(format)
          }

          connection.query('INSERT INTO subscription SET ? ', obj, function(err, result) {

            if (err) { 
              console.log(err)
              connection.rollback(function() {
                throw err;
              });
            }
        
            var item_id = result.insertId;
            var obj2 = {
              userId: req.cookies.userObj.id,
              price: req.query.price, 
              method: req.query.method, 
              status: 1, 
              itemType: 'S',
              itemId: item_id,
              createdAt: ((payment.create_time).split("T").join(" ")).split("Z").join(" "),
              returnId: payment.id,
            }
            
            connection.query('INSERT INTO payment SET ? ', obj2, function(err, result) {

              if (err) { 
                connection.rollback(function() {
                  throw err;
                });
              }  
              connection.commit(function(err) {
                if (err) { 
                  connection.rollback(function() {
                    throw err;
                  });
                }
                console.log('success!');
                res.send('<script>alert("complete!"); opener.location.reload(true); self.close();</script>');
              });
            });
          });
        });
      }
  });
};

// 구매내역 GET
exports.transactions = (req, res) => {

  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    //return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }
    let session = req.session;

    const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.

    //나라 목록
    var sql1 = 'SELECT COUNT(*) AS cnt FROM point WHERE user_id = ' + req.cookies.userObj.id;


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
        var sql = 'SELECT a.id, a.user_id, a.point, a.status, a.createdAt, b.name_eng, b.id as company_id from point a LEFT OUTER JOIN company b ON a.company_id = b.id WHERE user_id = ? ORDER BY id DESC LIMIT ?,?'
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
                res.render('point/transactions', {model:result, session : session, userObj: req.cookies.userObj});
            }
        });
        }
        
    });
};

// 결제 GET
exports.coin = (req, res) => {

  let session = req.session;


  res.render("pass/coin", {
      session : session,
      'userObj': req.cookies.userObj,
      'result' : 0
  });
};

// 멤버쉽 결제 확인 창 POST
exports.selMethod_coin = (req, res) => {

    var map = {};
    var cur;
    map['coin10'] = { coin: '10 coin', price: '10' };
    map['coin50'] = { coin: '50 coin', price: '30'};
    map['coin100'] = { coin: '100 coin', price:'50' };
    map['coin200'] = { coin: '200 coin', price:'100' };
  let session = req.session;

    connection.query('SELECT value FROM currencies WHERE defaultYN=' + '\'Y\';', (err,rs) => {
        if (err) {
            console.log(err);
            res.end();
        } else {
            cur = rs[0].value;
            res.render("pass/selMethod_coin", {
                session : session,
                userObj: req.cookies.userObj,
                subscriptionKey: req.body.radio_btn,
                data: map[req.body.radio_btn],
                comma: common.comma,
                currency: cur,
            });
        }
    });


};

exports.paypalCreate_coin = function (req, res) {

    var map = {};
    map['coin10'] = { coin: '10 coin', price: '10' };
    map['coin50'] = { coin: '50 coin',price: '30'};
    map['coin100'] = { coin: '100 coin',price:'50' };
    map['coin200'] = { coin: '200 coin',price:'100' };

  //paypal method방법(credit_card or paypal)
  var method = req.body.method;
  var coinTemp = req.body.subscriptionKey;

  var coin;
  var price = 0;

  //가격 설정
  if (coinTemp == "coin10") {
      coin="10";
    price = "10";
  } else if (coinTemp == "coin50") {
      coin="50";
    price = "30";
  } else if (coinTemp == "coin100") {
      coin="100";
    price = "50";
  } else if (coinTemp == "coin200") {
      coin="200";
    price = "100";
  }

  //내용 설정
  var create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": 'paypal'
      },
      "redirect_urls": {
          "return_url": 'https://' + req.headers.host + '/pass/success_coin?method=' + method + '&coin=' + coin + '&price=' + price,
          "cancel_url": 'https://' + req.headers.host + '/pass/coin'
          /*"return_url": 'http://' + req.headers.host + '/pass/success_coin?method=' + method + '&coin=' + coin + '&price=' + price,
          "cancel_url": 'http://' + req.headers.host + '/pass/coin'*/
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": coin + " coin",
                  "sku": 'points',
                  "price": price,
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": price
          },
          "description": "This is the payment description."
      }]
  };

  //페이팔 결제 생성
  paypal.payment.create(create_payment_json, function (error, payment) {

    if (error) {
      console.log(error.details);
    } else {

      for(let i = 0;i < payment.links.length;i++){
        //승인된다면
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
};

//결제 성공시
exports.success_coin = function(req, res) {
  
  if (!req.cookies.userObj)  {
    var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
    return res.redirect('https://' + req.headers.host + '/user/login?redirect=' + fullUrl);
    //return res.redirect('http://' + req.headers.host + '/user/login?redirect=' + fullUrl);
  }

  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": req.query.price
        }
    }]
  };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {

        var createdAt = moment.utc().format(format);
        var startedAt = moment.utc().format('YYYY-MM-DD HH:mm');
        var expiredAt = moment().add(12, 'months').utc().format('YYYY-MM-DD') + ' 23:59';

        var item_id;
        //성공시
        //트랜잭션 시작,,
        connection.beginTransaction(function(err) {
          if (err) { throw err; }

          var obj = {
            userId: req.cookies.userObj.id,
            status: 1,
            coin: req.query.coin,
            startedAt: startedAt,
            expiredAt: expiredAt,
            createdAt: createdAt
          }


          //coin 등록
          connection.query('INSERT INTO coin SET ? ', obj, function(err, result) {

            if (err) { 
              connection.rollback(function() {
                throw err;
              });
            }
        
            item_id = result.insertId;

            var obj2 = {
              userId: req.cookies.userObj.id,
              status: 1, 
              coin: req.query.coin,
              orgId: item_id,
              startedAt: startedAt,
              expiredAt: expiredAt,
              createdAt: createdAt
            }
            
            //코인 상세 등록
            connection.query('INSERT INTO coin_detail SET ? ; UPDATE coin_detail SET detailId = id WHERE id = LAST_INSERT_ID()', obj2, function(err, result) {

              if (err) { 
                connection.rollback(function() {
                  throw err;
                });
              }

                  var obj3 = {
                    userId: req.cookies.userObj.id,
                    price: req.query.price, 
                    method: req.query.method, 
                    status: 1, 
                    itemType: 'C',
                    itemId: item_id,
                    createdAt: ((payment.create_time).split("T").join(" ")).split("Z").join(" "),
                    returnId: payment.id,
                  }

                  //결제 등록
                  connection.query('INSERT INTO payment SET ? ', obj3, function(err, result) {
  
                  if (err) { 
                    connection.rollback(function() {
                      throw err;
                    });
                  }  
                  connection.commit(function(err) {
                    if (err) { 
                      connection.rollback(function() {
                        throw err;
                      });
                    }
                    console.log('success!');
                    res.send('<script>alert("complete!"); opener.location.reload(true); self.close();</script>');
                  });
                });
              });
            });
        });
      }
  });
};

// 멤버쉽 결제 확인 창 POST
exports.transferCreate_coin = (req, res) => {

    var setting;
    //선택한 코인 정보 가져오기
    var coin = req.body.subscriptionKey;
    var coinprice;
    var price;

    let session = req.session;

    //가격 설정
    if ( coin == "coin10") {
        coinprice="10";
      price = "10";
    } else if (coin == "coin50") {
        coinprice="50";
      price = "30";
    } else if (coin == "coin100") {
        coinprice="100";
      price = "50";
    } else if (coin == "coin200") {
        coinprice="200";
      price = "100";
    }

    //pdf에 들어갈 정보 가져오기기
  connection.query('SELECT companyAddress, beneficiary, bank, accountNo, swiftCode, bankTelephone, bankAddress, othersBeneficiaryTel, beneficiaryAddress, branchOfBank, note1, note2, note3, note4, note5 FROM wireTransfer_setting', (err,rs) => {
      if (err) {   
          console.log(err);
          res.end();
      } else {
          
        setting = rs[0];

        res.render("pass/payment_wt_coin", {
          coin: coinprice,
          price: price,
          method: req.body.method,
          session : session,
          'userObj': req.cookies.userObj,
          moment: moment,
          setting: setting
        });
      }
  });
};


//결제 성공시
exports.processWireTransfer_coin = function(req, res) {

  var year = new Date().getFullYear();		// 현재 월 변수에 저장
  var month = new Date().getMonth() + 1;		// 현재 월 변수에 저장

  common.createYearFolder('invoice', year);
  common.createMonthFolder('invoice', year, month);

  var invoiceDate = moment.utc().local().format('YYYY-MM-DD');
  var invoiceNo = 'P' + moment.utc().local().format('YYMMDD') + common.makeNo(10);
  var createdAt = moment.utc().format(format);

  var setting;

  connection.query('SELECT companyAddress, beneficiary, bank, accountNo, swiftCode, bankTelephone, bankAddress, othersBeneficiaryTel, beneficiaryAddress, branchOfBank, note1, note2, note3, note4, note5 FROM wireTransfer_setting', (err,rs) => {   
    if (err) {   
        console.log(err);
        res.end();
    } else {
        
      setting = rs[0];

      //성공시
      //트랜잭션 시작,,
      connection.beginTransaction(function(err) {
        if (err) { throw err; }

        var obj = {
          userId: req.cookies.userObj.id,
          status: 0,
          coin: req.body.coin,
          createdAt: createdAt
      }
      connection.query('INSERT INTO coin SET ? ', obj, function(err, result) {

        if (err) { 
          console.log(err)
          connection.rollback(function() {
            throw err;
          });
        }
    
        var item_id = result.insertId;
        var obj2 = {
          userId: req.cookies.userObj.id,
          price: req.body.price, 
          method: req.body.method, 
          status: 0, 
          itemType: 'C',
          itemId: item_id,
          remitterName: req.body.remitterName,
          email: req.body.email,
          contactName: req.body.contactName,
          companyName: req.body.companyName,
          country: req.body.country,
          phone: req.body.phone,
          createdAt: createdAt,
          invoiceNo: invoiceNo,
          path: 'invoice/' + year + '/' + month + '/',
          filename: invoiceNo + '.pdf',
        }
        
        connection.query('INSERT INTO payment SET ? ', obj2, function(err, result) {

          if (err) { 
            connection.rollback(function() {
              throw err;
            });
          }  
          connection.commit(function(err) {
            if (err) { 
              connection.rollback(function() {
                throw err;
              });
            }
              req.body.months = '12'
              req.body.createdAt = invoiceDate;
              req.body.logo = path.join(filePath, '/img/pdf_icon.png')
              req.body.type = 'Coin';
              req.body.invoiceNo = invoiceNo;
              
              var pdfDoc = printer.createPdfKitDocument(pdf.getData(setting, req.body));
                pdfDoc.pipe(fs.createWriteStream(filePath + '/uploads/invoice/' + year + '/' + month + '/' +  invoiceNo + '.pdf')).on('finish',function(){

                  //메일 옵션
                  var mailOpt = {
                    from: 'autoinspec@autoinspec.com',
                    to: req.cookies.userObj.email,
                    subject: '[AUTOINSPEC] Wire Transfer',
                    html: header_mail.getData(req.protocol + '://' + req.headers.host) + content_html.getData()
                      + footer_mail.getData(req.protocol + '://' + req.headers.host),
                    attachments: [{
                      filename: invoiceNo + '.pdf',
                      path: filePath + '/uploads/invoice/' + year + '/' + month + '/' +  invoiceNo + '.pdf',
                      contentType: 'application/pdf'
                    }],
                  };
                  //전송
                  smtpTransport.sendMail(mailOpt, function(err, res) {
                    if (err) {
                        console.log(err);
                    } else {
                            console.log('email has been sent.');
                    }
                    smtpTransport.close();
                });
                //success
                res.send('<script>alert("Payment Notice will be provide your e-mail to your bank as needed."); opener.location.reload(true); self.close(); </script>');
                 
              });
                pdfDoc.end();
              
            });
          });
        });
      });
    }
});
};

//코인으로 구매하기
exports.useCoin = function (req, res) {

  var query = [];
  var jsonData = req.body;
  var createdAt = moment.utc().format(format);
  var coin = parseInt(jsonData['coin']);
  var type = "";
  var ppId;

  //detail 아이템 & component 아이템 삿을 때
  if (jsonData['typeD'] == "1" && jsonData['typeC'] == "1") {
    type = 'A';
  //detail 아이템만 샀을 때
  } else if (jsonData['typeD'] == "1" && jsonData['typeC'] == "0") {
    type = 'D';
  //component 아이템만 삿ㅇ르 때
  } else if (jsonData['typeD'] == "0" && jsonData['typeC'] == "1") {
    type = 'C';
  } else if (jsonData['typeR'] == "1") {
    type = 'R';
  }

  //트랜잭션 시작,,
  connection.beginTransaction(function(err) {
    
    if (err) { throw err; }

    var period_format = 'YYYY-MM-DD HH:mm';
    var start = moment.utc().format(period_format);
    var end = moment().add(1, 'months').utc().format('YYYY-MM-DD') + ' 23:59';

    var obj = {
      userId: req.cookies.userObj.id,
      email: (type == 'R') ? jsonData['email']: '',
      companyId: jsonData['companyId'],
      type: type,
      start: (type == 'R') ? '': start,
      end: (type == 'R') ? '': end,
      status: (type == 'R') ? 0 : 1,
      createdAt: createdAt
    }

    connection.query('INSERT INTO purchasedproduct SET ? ', obj, function(err, result) {

      if (err) { 
        console.log(err)
        connection.rollback(function() {
          throw err;
        });
      }

      ppId = result.insertId;

      var obj = {
        userId: req.cookies.userObj.id,
        ppId: ppId,
        coin: -1 * parseInt(jsonData['coin']),
        status: 2,
        createdAt: createdAt
      }

    connection.query('INSERT INTO coin SET ? ', obj, function(err, result) {

      if (err) { 
        console.log(err)
        connection.rollback(function() {
          throw err;
        });
      }
  
      var item_id = result.insertId;
      
      
      connection.query('SELECT *, SUM(coin) AS sum FROM coin_detail WHERE userId = ? GROUP BY detailId having SUM(coin) > 0; ', [req.cookies.userObj.id], function(err, result) {

        if (err) { 
          connection.rollback(function() {
            throw err;
          });
        }  

        var list = result;
        for (var i=0; i<list.length; i++) {
          var id = list[i].id;
          var detail_coin = parseInt(list[i].sum);
          var set_coin = 0;

          if (coin < detail_coin) {
            set_coin = coin;
          } else {
            set_coin = detail_coin;
          }
          console.log(set_coin);

          var obj2 = {
            userId: req.cookies.userObj.id,
            status: 2,
            coin: -1 * set_coin,
            detailId: id,
            orgId: item_id,
            createdAt: createdAt,
            expiredAt: list[i].expiredAt,
            ppId: ppId
          }

          query.push(queryExec('INSERT INTO coin_detail SET ? ', obj2));
           
          coin -= detail_coin;

            //차감된 coin이 아직 남았다면 for문 더 돌리기
            if (coin < 0 || coin == 0) {
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
                            res.status(200).json({ 'status': 200, 'msg': 'Complete!' });
                          });
                    })
                } catch (err) {
                    console.log(err)
                    res.status(400).json({ 'status': 400, 'msg': '오류로 중지되었습니다.' });
                }
                })()
                break;
            }
        }
  });
});
});
});
};

exports.cancelRequest = function (req, res) {

  var sql = 'SELECT itemType, itemId FROM payment WHERE id = ?'

  connection.query(sql,[req.params.id], (err,rs) => {   
      if(err){   
          console.log(err);
          res.end();
      } else {
         
        var sql = 'UPDATE payment SET status = 2 WHERE id = ?; ';
        if (rs[0].itemType == 'S') {
          sql += 'UPDATE subscription SET status = 2 WHERE id = ?'
        } else {
          sql += 'UPDATE coin SET status = 2 WHERE id = ?'
        }
          connection.query(sql,[req.params.id, rs[0].itemId], (err,rs) => {   
              if(err){   
                  console.log(err);
                  res.end();
              } 
              res.status(200).json({ 'status': 200, 'msg': 'Complete!' });
            });
        }
          
  });
};

exports.cancel = function (req, res) {

  var sql = 'SELECT itemType, itemId FROM payment WHERE id = ?'

  connection.query(sql,[req.params.id], (err,rs) => {   
      if(err){   
          console.log(err);
          res.end();
      } else {
         
        var sql = 'UPDATE payment SET status = 3, canceledAt = ? WHERE id = ?; ';
        if (rs[0].itemType == 'S') {
          sql += 'UPDATE subscription SET status = 3 WHERE id = ?'
        } else {
          sql += 'UPDATE coin SET status = 3 WHERE id = ?'
        }
          connection.query(sql,[moment.utc().format(format), req.params.id, rs[0].itemId], (err,rs) => {   
              if(err){   
                  console.log(err);
                  res.end();
              } 
              res.status(200).json({ 'status': 200, 'msg': 'Complete!' });
            });
        }
          
  });
};

exports.getSubscriptionData = function(req, res) {

  connection.query('SELECT a.id, a.method, a.price, a.createdAt, a.status, a.itemType, a.remitterName, a.email, a.contactName, a.companyName, a.country, a.phone, a.acceptedAt, a.invoiceNo, a.path, a.filename, ' +
        'a.canceledAt, b.title, b.months, b.start, b.end, c.email, c.first_name, c.last_name FROM payment a LEFT OUTER JOIN subscription b ON a.itemId = b.id LEFT OUTER JOIN users c ON a.userId = c.id ' +
        'WHERE a.id=' + req.params.id, (err,rs) => {   
      if (err) {   
          console.log(err);
          res.end();
      } else {
          res.status(200).json({data: rs[0]});
      }
  });

  
}

exports.getCointData = function(req, res) {
  connection.query('SELECT a.id, a.method, a.price, a.createdAt, a.status, a.itemType, a.remitterName, a.email, a.contactName, a.companyName, a.country, a.phone, a.acceptedAt, a.invoiceNo, a.path, a.filename, ' +
        'a.canceledAt, b.coin as title, b.startedAt as start, b.expiredAt as end, c.email, c.first_name, c.last_name FROM payment a LEFT OUTER JOIN coin b ON a.itemId = b.id LEFT OUTER JOIN users c ON a.userId = c.id ' +
        'WHERE a.id=' + req.params.id, (err,rs) => {   
      if (err) {   
          console.log(err);
          res.end();
      } else {
          res.status(200).json({data: rs[0]});
      }
  });
}

//승인
exports.approval = function(req, res) {

  var period_format = 'YYYY-MM-DD HH:mm';
  var start = moment.utc().format(period_format);
  var end = moment().add(12, 'months').utc().format('YYYY-MM-DD') + ' 23:59';
  var payment_data;

  //결제 정보 받아옴
  var sql = 'SELECT a.itemType, a.itemId, b.months, c.coin FROM payment a LEFT OUTER JOIN subscription b ON a.itemId = b.id LEFT OUTER JOIN coin c ON a.itemId = c.id WHERE a.id = ?'
  connection.query(sql,[req.params.id], (err,rs) => {   
      if(err){   
          console.log(err);
          res.end();
      } else {
          
        payment_data = rs[0];

        //트랜잭션 시작,,
        connection.beginTransaction(function(err) {
          if (err) { throw err; }


          //승인 날짜와 상태 변경
          connection.query('UPDATE payment SET acceptedAt = ?, status = 1 WHERE id= ?', [start, req.params.id], function(err, result) {

            if (err) { 
              console.log(err)
              connection.rollback(function() {
                throw err;
              });
            }

            //코인에 관련된 결제
            if (payment_data.itemType == 'C') {

              //createdAt과 expiredAt 그리고 상태 변경
              connection.query('UPDATE coin SET starteddAt = ?, expiredAt = ?, status = 1 WHERE id = ?; ', [start, end, payment_data.itemId], function(err, result) {

                if (err) { 
                  connection.rollback(function() {
                    throw err;
                  });
                }  
                var obj2 = {
                  userId: req.cookies.userObj.id,
                  status: 1, 
                  coin: payment_data.coin,
                  orgId: payment_data.itemId,
                  starteddAt: start,
                  expiredAt: end,
                }
                
                //코인 상세 등록
                connection.query('INSERT INTO coin_detail SET ? ; UPDATE coin_detail SET detailId = id WHERE id = LAST_INSERT_ID()', obj2, function(err, result) {
    

                  if (err) { 
                    connection.rollback(function() {
                      throw err;
                    });
                  }  
                  connection.commit(function(err) {
                    if (err) { 
                      connection.rollback(function() {
                        throw err;
                      });
                    }
                    res.status(200).json({ 'status': 200, 'msg': 'Complete!' });
                  });
                });
              });

            } else {
              //createdAt과 expiredAt 그리고 상태 변경
              end = moment().add(payment_data.months, 'months').utc().format(period_format);
              connection.query('UPDATE subscription SET start = ?, end = ?, status = 1 WHERE id = ?', [start, end, payment_data.itemId], function(err, result) {

                if (err) { 
                  connection.rollback(function() {
                    throw err;
                  });
                }  
                connection.commit(function(err) {
                  if (err) { 
                    connection.rollback(function() {
                      throw err;
                    });
                  }
                  res.status(200).json({ 'status': 200, 'msg': 'Complete!' });
                });
              });
            }
          });
        });
          
      }
  });
};

//결제 성공시
exports.sendBonusCoin = function(req, res) {
  
  var createdAt = moment.utc().format(format);
  var startedAt = moment.utc().format('YYYY-MM-DD HH:mm');
  var expiredAt = moment().add(12, 'months').utc().format('YYYY-MM-DD') + ' 23:59';

  var item_id;

  //트랜잭션 시작,,
  connection.beginTransaction(function(err) {
    if (err) { throw err; }

    var obj = {
      userId: req.params.id,
      status: 1,
      coin: req.params.coin,
      startedAt: startedAt,
      expiredAt: expiredAt,
      createdAt: createdAt,
      bonusYN: 'Y'
    }

    //coin 등록
    connection.query('INSERT INTO coin SET ? ', obj, function(err, result) {

      if (err) { 
        connection.rollback(function() {
          throw err;
        });
      }
  
      item_id = result.insertId;

      var obj2 = {
        userId: req.params.id,
        status: 1, 
        coin: req.params.coin,
        orgId: item_id,
        startedAt: startedAt,
        expiredAt: expiredAt,
        createdAt: createdAt
      }
            
      //코인 상세 등록
      connection.query('INSERT INTO coin_detail SET ? ; UPDATE coin_detail SET detailId = id WHERE id = LAST_INSERT_ID()', obj2, function(err, result) {

        if (err) { 
          connection.rollback(function() {
            throw err;
          });
        }

            
            connection.commit(function(err) {
              if (err) { 
                connection.rollback(function() {
                  throw err;
                });
              }
              console.log('success!');
              res.send('<script>alert("complete!"); opener.location.reload(true); self.close();</script>');
            });
        });
  });                   
  });
};

//유효기간 체크 후 상태 처리
exports.checkExpiredDate = function (req, res) {

  var query = [];
  
  var today = moment.utc().format('YYYY-MM-DD HH:mm');

  //트랜잭션 시작
  connection.beginTransaction(function(err) {
    if (err) { throw err; }

    //subscription 유효기간 체크 후 처리
    query.push(queryExec('UPDATE subscription SET status = 4 WHERE userId = ? AND status = 1 AND (STR_TO_DATE( end, "%Y-%m-%d %H:%i") <  STR_TO_DATE( ?, "%Y-%m-%d %H:%i") OR STR_TO_DATE( end, "%Y-%m-%d %H:%i") =  STR_TO_DATE( ?, "%Y-%m-%d %H:%i")) ;', [req.params.id, today, today]));

    //coin 유효기간 체크 후 처리
    connection.query('SELECT id, detailId, orgId, sum(coin) AS sum FROM coin_detail WHERE userId = ? AND (STR_TO_DATE( expiredAt, "%Y-%m-%d") <  STR_TO_DATE( ?, "%Y-%m-%d") OR STR_TO_DATE( expiredAt, "%Y-%m-%d") =  STR_TO_DATE( ?, "%Y-%m-%d")) ' +
        'GROUP BY detailId HAVING sum(coin) > 0', [req.params.id, today, today], function(err, result) {

      if (err) { 
        console.log(err)
        connection.rollback(function() {
          throw err;
        });
      }
      var list = result;
      if (list.length == 0) {
        (async () => {
          try {
              Promise
              .all(query)
              .then(values => {
                //commit
                connection.commit(function(err) {
                    if (err) { 
                        connection.rollback(function() {
                            throw err;
                        });
                    }
                    res.status(200).json({ 'status': 200, 'msg': 'Complete!' });
                  });
              })
          } catch (err) {
              console.log(err)
              res.status(400).json({ 'status': 400, 'msg': '오류로 중지되었습니다.' });
          }
          })()
      } else {
        for (var i=0; i<list.length; i++) {

          //유효기간 지난 코인들 처리~
          var obj = {
            userId: req.params.id, status: 3, coin: -1 * list[i].sum, createdAt: today
          }
  
          var obj2 = {
            userId: req.params.id, status: 3, coin: -1 * list[i].sum, detailId: list[i].detailId, createdAt: today
          }
  
          query.push(queryExec('INSERT INTO coin SET ? ; SET @orgId = LAST_INSERT_ID(); INSERT INTO coin_detail SET orgId = @orgId, ? ;', [obj, obj2]));
  
              //차감된 coin이 아직 남았다면 for문 더 돌리기
              if (i == list.length -1) {
  
                //async 쿼리 처리
                (async () => {
                  try {
                      Promise
                      .all(query)
                      .then(values => {
                        //commit
                        connection.commit(function(err) {
                            if (err) { 
                                connection.rollback(function() {
                                    throw err;
                                });
                            }
                            res.status(200).json({ 'status': 200, 'msg': 'Complete!' });
                          });
                      })
                  } catch (err) {
                      console.log(err)
                      res.status(400).json({ 'status': 400, 'msg': '오류로 중지되었습니다.' });
                  }
                  })()
                  break;
              }
            }
      }
    });
});
  
};

exports.getCurrentSubscription = function(req, res) {

  var result = false;
  var status = -1;

    connection.query('SELECT id, status, title, months, price FROM subscription WHERE (status = 1 OR status = 0) AND userId=' + req.params.id, (err,rs) => {   
      if (err) {   0
          console.log(err);
          res.end();
      } else {

        if (rs.length > 0) {
          result = true;
          status = rs[0].status;
        }

        res.status(200).json({ 'result': result, 'status': status, 'msg': 'Complete!' });
     }
  });
};


