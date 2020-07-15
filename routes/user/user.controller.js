const config = require('../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const crypto = require('crypto');
const header_mail = require('../../public/js/mail_template/header');
const footer_mail = require('../../public/js/mail_template/footer');
const content_html = require('../../public/js/mail_template/auth_content');
const findPassword_content_html = require('../../public/js/mail_template/findPassword_content');
var bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();

var moment = require('moment');
require('moment-timezone');

//메일 관련
var nodemailer = require('nodemailer');
var smtpTransporter = require('nodemailer-smtp-transport');

//메일 서버
/*var smtpTransport = nodemailer.createTransport(smtpTransporter ( {
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
*/

// 로그인 GET
exports.login = (req, res) => {
    let session = req.session;
  
    res.render("auth/login", {
      session : session,
      'userObj': req.cookies.userObj
    });
};

//로그인
exports.goLogin = (req, res) => {

  const format = 'YYYY-MM-DD HH:mm:ss';
  //console.log(moment.utc().format(format));

    var obj

    var sql = "SELECT * FROM users WHERE email = ?";
    connection.query(sql, [req.body.email], function(err, results) {

      if(err) console.log(err);

      if(results.length == 0) {
        obj = { 'msg': 'please check your email'}
        res.send(obj);
      }
        
      else {
        var user = results[0];

        if(user.email_verified == 'N')  {
          obj = { 'msg': 'please check your mailbox'}
          res.send(obj);
        }
        else {
          hasher(
            { password: req.body.password, salt:user.salt },
            function (err, pass, salt, hash) {
              if (user.password == hash) {

                req.session.displayName = user.last_name + ' ' + user.first_name;

                req.session.save(function(){//데이터 저장이 끝났을때 호출됨 안전하게 redirect하기 위함
                    obj = { 'msg': 'success', 'id': user.id, 'redirect': req.query.redirect }
                    var expiryDate = new Date( Date.now() + 60 * 60 * 1000 * 24 * 7); // 24 hour 7일

                    //쿠키 저장할 데이터 수정
                    user.password = "";
                    user.salt = "";

                    res.cookie('userObj', user, { expires: expiryDate, httpOnly: true });

                    //최근 로그인 업데이트~
                    var sql= 'UPDATE users SET recentlyLogin = ? WHERE id = ?';
                    connection.query(sql, [moment.utc().format(format), user.id], function(err, result) {

                          if (err) {
                            console.log(err);
                          } else {
                              res.send(obj);
                          }
                    });
                  });
              } else {
                obj = { 'msg': 'please check your password'}
                res.send(obj);
              }
            } 
          )
        }
      }
    })
};

// 회원가입 GET
exports.sign_up = (req, res) => {
    res.render("auth/signup", {userObj: req.cookies.userObj});
};

// 회원가입 GET
exports.gosign_up = (req, res, next) => {

  //아이디 체크
  var sql= 'SELECT * FROM users WHERE email = ?';
  connection.query(sql, [req.body.email], function(err, result) {

        if (err) {
          console.log(err);
        }

        //존재하지 않으면
        else if(result.length == 0){

          //이메일 인증키 생성
          var key_one=crypto.randomBytes(256).toString('hex').substr(100, 5);
          var key_two=crypto.randomBytes(256).toString('base64').substr(50, 5);
          var key_for_verify=key_one+key_two;
      
          var company_id = (req.body.company_id == '') ? 0: req.body.company_id;
          const format = 'YYYY-MM-DD HH:mm:ss';
          console.log(moment.utc().format(format));

          //비밀번호 머시기
          hasher(
              { password: req.body.password },
              function (err, pass, salt, hash) {
                var user = {
                  last_name: req.body.last_name,
                  first_name: req.body.first_name,
                  password: hash,
                  salt: salt,
                  email: req.body.email,
                  key_for_verify: key_for_verify,
                  email_verified: 'N',
                  company_verified: 'N',
                  company_id: company_id,
                  createdAt: moment.utc().format(format)
                };
                connection.query(
                  'INSERT INTO users SET ?',
                  user, 
                  function (err, result) {
                    if (err) throw err;
                    else {
                      var url = 'http://' + req.get('host') + '/user/confirmEmail'+'?key=' + key_for_verify;
                      //var url = 'https://' + req.get('host') + '/user/confirmEmail'+'?key=' + key_for_verify;

                      //메일 옵션
                      var mailOpt = {
                        from: 'autoinspec@autoinspec.com',
                        to: req.body.email,
                        subject: '[AUTOINSPEC] Email Authentication',
                        html: header_mail.getData(req.protocol + '://' + req.headers.host) + content_html.getData(url)
                        + footer_mail.getData(req.protocol + '://' + req.headers.host)
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
                      res.send('');
                    }
                });
              }
            );
        }
        //존재하면
        else {
            res.send("exist")
        }
  });
};

//이메일 인증 눌렀을때
exports.confirmEmail = (req, res) => {

  var sql= 'UPDATE users SET email_verified = ? WHERE key_for_verify = ?';
  connection.query(sql, ['Y', req.query.key], function(err, result) {

        if (err) {
          console.log(err);
        }
        //일치하는 key가 없으면
        else if(result.affectedRows == 0){
            res.send('<script type="text/javascript">alert("Not verified"); window.location="/"; </script>');
        }
        //인증 성공
        else {
            res.send('<script type="text/javascript">alert("Successfully verified"); window.location="/"; </script>');
        }
  });
};

// 비밀번호 찾기 GET
exports.forgotPassword = (req, res) => {
  res.render("auth/forgotPassword", {userObj: req.cookies.userObj});
};

exports.createNewPassword = (req, res) => {

  var newPassord = makeid(10);

  var sql = "SELECT * FROM users WHERE email = ?";
  connection.query(sql, [req.body.email], function(err, results) {

    if(err) console.log(err);

    if(results.length == 0) {
      res.send({ 'state': 1, 'msg': 'This email does not exist'});
    }
      
    else {
          hasher(
            { password: newPassord },
            function (err, pass, salt, hash) {
              var user = {
                password: hash,
                salt: salt
              };
              connection.query(
                'UPDATE users SET ? WHERE email = ?',
                [user, req.body.email], 
                function (err, result) {
                  if (err) throw err;
                  else {

                    //메일 옵션
                    var mailOpt = {
                      from: 'autoinspec@autoinspec.com',
                      to: req.body.email,
                      subject: '[AUTOINSPEC] Your Temporary Password',
                      html: header_mail.getData(req.protocol + '://' + req.headers.host) + findPassword_content_html.getData(newPassord)
                      + footer_mail.getData(req.protocol + '://' + req.headers.host)
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
                    res.send({ 'state': 2, 'msg': 'please check your mailbox'});
                  
                  }
            }
          );
      })
    }
  })
};

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// 로그인 GET
exports.logout = (req, res) => {
  delete req.session.displayName;//세션 삭제

  req.session.save(function(){//데이터 저장이 끝났을때 호출됨 안전하게 redirect하기 위함
    res.clearCookie("userObj");
    res.redirect('/');
  });
}

  //admin에 접속시 권한 체크
exports.loginCheck = (req, res) => {
	if ( req.cookies.userObj ) { 
		res.status(200).json({ result: true, id: req.cookies.userObj.id, fullUrl: '' });
	} else {
    var json = req.body;
		var fullUrl = req.protocol + '://' + req.headers.host + json['url'];
    res.status(200).json({ result: false, fullUrl: 'http://' + req.headers.host + '/user/login/?redirect=' + fullUrl });
	}
}
