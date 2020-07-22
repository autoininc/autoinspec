const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../../public/js/common');
const header_mail = require('../../../public/js/mail_template/header');
const footer_mail = require('../../../public/js/mail_template/footer');
const content_html = require('../../../public/js/mail_template/credit_content');

//파일 관련
const fs = require('fs'); 
const mime = require('mime-types');
const path = require('path');
const filePath = path.join(__dirname, '../../../public/uploads/')

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

exports.list = (req, res) => {

  const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.
    var status = (req.query.status == null) ? '':req.query.status;

    //나라 목록
    var sql1 = 'SELECT COUNT(*) as cnt, COUNT(IF (status = 0, id, null)) as waiting, COUNT(IF (status = 1, id, null)) as complete FROM purchasedproduct WHERE type = "R"'

    connection.query(sql1, (err,result) => { 
        if(err) {
            console.log(err);
            res.end();
        }
        count = result[0];

        var sql2 = 'SELECT COUNT(*) AS cnt FROM purchasedproduct WHERE type = "R" ';
        if (status != '') {
          sql2 += 'AND status = ' + status;
        }
        connection.query(sql2, (err,result) => {

            if(err) {
                console.log(err);
                res.end();
            } else {

                var totalCount = Number(result[0].cnt); // NOTE: 전체 글 개수.
                var pnTotal = Math.ceil(totalCount / contentSize); // NOTE: 페이지네이션의 전체 카운트
                var pnStart = ((Math.ceil(pageNum / pnSize) - 1) * pnSize) + 1; // NOTE: 현재 페이지의 페이지네이션 시작 번호.
                let pnEnd = (pnStart + pnSize) - 1; // NOTE: 현재 페이지의 페이지네이션 끝 번호.

                var sql = 'SELECT a.id, a.email, a.type, a.status, a.createdAt, b.coin, c.id as company_id, c.name_eng FROM purchasedproduct a  LEFT OUTER JOIN coin b ON a.id = b.ppId ' +
                          'LEFT OUTER JOIN company c ON a.companyId = c.id LEFT OUTER JOIN users d ON a.userId = d.id WHERE a.type = "R" ';
                if (status != '') {
                  sql += 'AND a.status = ' + status;
                }

                sql += ' ORDER BY a.id DESC LIMIT ?,?';

                //행 개수 구하는 쿼리 실행
                connection.query(sql, [skipSize, contentSize], (err,rs) => {   
    
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
                            res.render('admin/creditReport/list', {model:result, userObj: req.cookies.userObj, moment: moment});
                    }
                });
            }
                    
                });
    });
};

exports.view = (req, res) => {

  let model = {};
  connection.query('SELECT a.id, a.email, a.type, a.status, a.createdAt, b.coin, c.name_eng, d.first_name, d.last_name FROM purchasedproduct a LEFT OUTER JOIN coin b ON a.id = b.ppId LEFT OUTER JOIN company c ON a.companyId = c.id ' +
                    'LEFT OUTER JOIN users d ON a.userId = d.id WHERE a.id=' + req.params.id, (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {

          var year = new Date().getFullYear();		// 현재 월 변수에 저장
          var month = new Date().getMonth() + 1;		// 현재 월 변수에 저장

          common.createYearFolder('creditReport', year);
          common.createMonthFolder('creditReport', year, month);
          
          connection.query('SELECT id, path, filename, createdAt FROM creditreport_file WHERE ppId=' + rs[0].id, (err,result) => {   
            if (err) {   
                console.log(err);
                res.end();
            }
            
            model.fileData = result;
            res.render("admin/creditReport/view",{data:rs, model: model, path: 'creditReport/' + year + '/' + month + '/', userObj: req.cookies.userObj});
          });
          
       }
    });
};

exports.modify = (req, res) => {

    connection.query('UPDATE purchasedproduct SET status = ? WHERE id = ' + req.params.id, [req.body.status],(err) => {   
      if (err) {   
          console.log(err);
          res.status(400).json({ 'msg': "error" });
      } else {

        var obj = {
          ppId: req.params.id,
          createdAt: moment.utc().format(format),
        };

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

          connection.query('DELETE FROM creditreport_file WHERE ppId = ? ; INSERT INTO creditreport_file SET ? ;', 
              [req.params.id, obj], (err,rs) => {   
              if (err) {   
                  console.log(err);
                  res.end();
              } else {


                  res.status(200).json({ 'msg': "success" });
              }
          }); 
        }
      });
};

//메일 보내기
exports.sendMail = (req, res) => {

  //정보 가져오기
  var data = undefined;
  var file = undefined;

  connection.query('SELECT a.id, a.email, a.type, a.status, a.createdAt, b.coin, c.name_eng, d.first_name, d.last_name FROM purchasedproduct a LEFT OUTER JOIN coin b ON a.id = b.ppId LEFT OUTER JOIN company c ON a.companyId = c.id ' +
                    'LEFT OUTER JOIN users d ON a.userId = d.id WHERE a.id=' + req.params.id, (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {

          data = rs;

          connection.query('SELECT id, path, filename, createdAt FROM creditreport_file WHERE ppId=' + data[0].id, (err,result) => {   
            if (err) {   
                console.log(err);
                res.end();
            }
            file = result;
             //메일 옵션
             var mailOpt = {
              from: 'autoinspec@autoinspec.com',
              to: data[0].email,
              subject: '[AUTOINSPEC] Credit report of ' + data[0].name_eng,
              html: header_mail.getData(req.protocol + '://' + req.headers.host) + content_html.getData(req.protocol + '://' + req.headers.host, data, file)
               + footer_mail.getData(req.protocol + '://' + req.headers.host)
            };

            //메일 전송
            smtpTransport.sendMail(mailOpt, function(err, res) {
              if (err) {
                  console.log(err);
              } 
              smtpTransport.close();
            });
            res.send('');
          });
       }
    });
  };

exports.delFile = (req, res) => {
    
  var jsonData = req.body;
  var fullpath = filePath + jsonData['path'] + jsonData['filename'];

  fs.unlink(fullpath, function(err){ // fs 모듈을 이용해서 파일 삭제합니다.​
  
      if(err) res.send(err); // 에러 확인
      
      connection.query('UPDATE creditreport_file SET path="", filename="" WHERE id = ' + req.params.id, (err) => { 

        if (err) {   
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
  });
};

