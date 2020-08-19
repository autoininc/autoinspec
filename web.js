//필요한 모듈 선언
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var cookieParser = require('cookie-parser');
const config = require('./conf/environments').info;
const app = express();

//express 서버 포트 설정(cafe24 호스팅 서버는 8001 포트 사용)
app.set('views', __dirname + '/views');
app.set("view engine", "ejs");
app.set('port', process.env.PORT || 8001);

app.use(express.static(__dirname + '/'))
app.use(bodyParser.json({limit: '100mb', type: 'application/json', parameterLimit:1000000})); // for parsing application/json
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true, parameterLimit:1000000 })); // for parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static('upload'));
app.use(cookieParser());
 app.use(session({
     secret: '1234DSFs@adf1234!@#$asd',
     resave: false,
     saveUninitialized: true,
     store: new MySQLStore(config)
   }));

    var httpServer = http.createServer(app);

    httpServer.listen(app.get('port'), function(){
    console.log("https Working on port");
});


// redirect HTTP to HTTPS
/*app.all('*', (req, res, next) => {
  let protocol = req.headers['x-forwarded-proto'] || req.protocol; 
  if (protocol == 'https' || req.headers.host == 'localhost') { 
    console.log("오니???");
    next(); 
  } else { 
    var from = req.protocol + '://' + req.headers.host + req.originalUrl;
    let to = 'https://' + req.headers.host + req.originalUrl;
    console.log("오니");
    console.log(to)
    // log and redirect 
    res.redirect(to); 
  } 
});*/


  //라우팅 모듈 선언
  var indexRouter = require('./routes/index');

  //request 요청 URL과 처리 로직을 선언한 라우팅 모듈 매핑
  app.use('/', indexRouter);

//admin에 접속시 권한 체크
app.route(/^\/admin(?:\/(.*))?$/).all(function(req, res, next) {
	var path = req.params[0];
	if ( req.cookies.userObj ) {
		next();
	} else {
		var fullUrl = req.protocol + '://' + req.headers.host + req.originalUrl;
		return res.redirect('https://' + req.headers.host + '/user/login/?redirect=' + fullUrl);
	}
});




/** admin 관련 */
app.use('/admin', require('./routes/admin/index'));
app.use('/admin/homepage', require('./routes/admin/homepage/index'));
app.use('/admin/company', require('./routes/admin/company/index'));

app.use('/admin/countries', require('./routes/admin/countries/index'));
app.use('/admin/category', require('./routes/admin/category/index'));
app.use('/admin/certification', require('./routes/admin/certification/index'));
app.use('/admin/field', require('./routes/admin/field/index'));
app.use('/admin/currency', require('./routes/admin/currency/index'));
app.use('/admin/description', require('./routes/admin/description/index'));
app.use('/admin/rating', require('./routes/admin/rating/index'));
app.use('/admin/payment', require('./routes/admin/payment/index'));
app.use('/admin/user', require('./routes/admin/user/index'));
app.use('/admin/creditReport', require('./routes/admin/creditReport/index'));
app.use('/admin/qna', require('./routes/admin/qna/index'));
app.use('/admin/customerManagement', require('./routes/admin/customerManagement/index'));


/** 홈페이지 관련 */
app.use('/info', require('./routes/info/index'));
app.use('/user', require('./routes/user/index'));
app.use('/company', require('./routes/company/index'));
app.use('/account', require('./routes/account/index'));
app.use('/pass', require('./routes/pass/index'));
app.use('/category', require('./routes/category/index'));
app.use('/autoinmap', require('./routes/autoinmap/index'));
