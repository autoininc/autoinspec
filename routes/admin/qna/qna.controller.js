const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../../public/js/common');
const header_mail = require('../../../public/js/mail_template/header');
const footer_mail = require('../../../public/js/mail_template/footer');
const content_html = require('../../../public/js/mail_template/qna_content');

//파일 관련
const fs = require('fs'); 
const mime = require('mime-types');
const path = require('path');
const filePath = path.join(__dirname, '../../../public/uploads/')

//시간 관련
var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';

//메일 관련
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
      user:'autoingroup@autoingroup.com',
      pass:'autoin102030', 
  },
  maxConnections:5,
  maxMessages:10
}));

//리스트
exports.list = (req, res) => {

  const pageNum = Number(req.query.pageNum) || 1; // NOTE: 쿼리스트링으로 받을 페이지 번호 값, 기본값은 1
    const contentSize = 10; // NOTE: 페이지에서 보여줄 컨텐츠 수.
    const pnSize = 10; // NOTE: 페이지네이션 개수 설정.
    const skipSize = (pageNum - 1) * contentSize; // NOTE: 다음 페이지 갈 때 건너뛸 리스트 개수.
    var status = (req.query.status == null) ? '':req.query.status;

    //status별 count
    var sql1 = 'SELECT COUNT(*) as cnt, COUNT(IF (status = 0, id, null)) as waiting, COUNT(IF (status = 1, id, null)) as complete FROM qna'

    connection.query(sql1, (err,result) => { 

        if(err) {
            console.log(err);
            res.end();
        }
        count = result[0];

        var sql2 = 'SELECT COUNT(*) AS cnt FROM qna ';
        if (status != '') {
          sql2 += 'WHERE status = ' + status;
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

                var sql = 'SELECT a.id, a.userId, a.email, a.type, a.title, a.contents, a.createdAt, a.status, a.filename, b.name_eng from qna a LEFT OUTER JOIN company b ON a.companyId = b.id LEFT OUTER JOIN users c ON a.userId = c.id ';
                if (status != '') {
                  sql += 'WHERE status = ' + status;
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
                            res.render('admin/qna/list', {model:result, userObj: req.cookies.userObj, moment: moment});
                    }
                });
            }
                    
        });
    });
};

//상세보기
exports.view = (req, res) => {

  var answerdata = undefined;

  //질문 가져옴
  connection.query('SELECT a.id, a.userId, a.email, a.type, a.companyId, a.title, a.contents, a.createdAt, a.status, a.path, a.filename, a.sendYN, b.name_eng FROM qna a LEFT OUTER JOIN company b ON a.companyId = b.id WHERE a.id=' + req.params.id, (err,rs) => {   
        
    if (err) {   
          console.log(err);
          res.end();
      } else {

        //날짜별로 폴더 생성
        var year = new Date().getFullYear();		// 현재 월 변수에 저장
        var month = new Date().getMonth() + 1;		// 현재 월 변수에 저장

        common.createYearFolder('qna', year);
        common.createMonthFolder('qna', year, month);

        //답변완료 상태이면 답변도 가져옴~
        if (rs[0].status == 1) {

          connection.query('SELECT id, title, contents, path, filename, createdAt FROM answer WHERE qnaId=' + rs[0].id, (err,result) => {   
            if (err) {   
                console.log(err);
                res.end();
            }
            answerdata = result;
            res.render("admin/qna/view",{data:rs, answerdata: answerdata, path: 'qna/' + year + '/' + month + '/', userObj: req.cookies.userObj});
          });
        } else {
          res.render("admin/qna/view",{data:rs, answerdata: answerdata, path: 'qna/' + year + '/' + month + '/', userObj: req.cookies.userObj});
        }
      }
  });
};

//수정
exports.modify = (req, res) => {

  //답변 완료 상태로 변경
    connection.query('UPDATE qna SET status = 1 WHERE id = ' + req.params.id, (err) => {   

      if (err) {   
          console.log(err);
          res.status(400).json({ 'msg': "error" });

      } else {

        var contents = req.body.contents;
        contents = contents.replace(/\n/g, "<br>");

        var obj = {
          qnaId: req.body.id,
          title: req.body.title,
          contents: contents,
          createdAt: moment.utc().format(format)
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
        
          connection.query('INSERT INTO answer SET ? ON DUPLICATE KEY UPDATE title  = VALUES(title), contents  = VALUES(contents), createdAt  = VALUES(createdAt), path  = VALUES(path), filename  = VALUES(filename);', 
            [obj], (err, result) => {   

            if (err) {   
                console.log(err);
                res.end();
            } else {
                res.status(200).json({ 'msg': "success", 'answerId' : result.insertId });
            }
        });
      }
  });
};

//다운로드
exports.download = (req, res) => {

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

}

//메일 보내기
exports.sendMail = (req, res) => {

  //정보 가져오기
  var qnadata = undefined;
  var answerdata = undefined;

  connection.query('SELECT a.id, a.userId, a.email, a.type, a.companyId, a.title, a.contents, a.createdAt, a.status, a.path, a.filename, a.sendYN, b.name_eng FROM qna a LEFT OUTER JOIN company b ON a.companyId = b.id WHERE a.id=' + req.params.qnaId, (err, rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {

          qnadata = rs;

          connection.query('SELECT id, title, contents, path, filename, createdAt FROM answer WHERE qnaId=' + req.params.qnaId, (err,result) => {   
            if (err) {   
                console.log(err);
                res.end();
            }
            answerdata = result;

            //메일 옵션
            var mailOpt = {
              from: 'autoinspec@autoinspec.com',
              to: qnadata[0].email,
              subject: '[AUTOINSPEC] Q&A answer to your question',
              html: header_mail.getData(req.protocol + '://' + req.headers.host) + content_html.getData(req.protocol + '://' + req.headers.host, qnadata, answerdata)
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

//파일 삭제
exports.delFile = (req, res) => {
    
  var jsonData = req.body;
  var fullpath = filePath + jsonData['path'] + jsonData['filename'];

  fs.unlink(fullpath, function(err){ // fs 모듈을 이용해서 파일 삭제합니다.​
  
      if(err) res.send(err); // 에러 확인
      
      connection.query('UPDATE answer SET path="", filename="" WHERE id = ' + req.params.id, (err) => { 

        if (err) {   
            console.log(err);
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
  });
};

