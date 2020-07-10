const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);
const common = require('../../../public/js/common');

//시간 관련
var moment = require('moment');
require('moment-timezone');
const format = 'YYYY-MM-DD HH:mm:ss';


// SUBSCRIPTION modForm GET
exports.view = (req, res) => {

    connection.query('SELECT creditRating, cashFlowRating, watchRating, ms, rc, msp, mpp, ssofp, cis, sfr, pr, sr, dr, mc, por, es, certification FROM description', (err,rs) => {   
        if (err) {   
            console.log(err);
            res.end();
        } else {
            res.render("admin/code/description/view",{data:rs, convert: common.cvtEscaptedHtmltoNormal, userObj: req.cookies.userObj});
        }
    });
};

// modForm GET
exports.mod = (req, res) => {

    var jsonData = req.body;
    
    var obj = { creditRating: jsonData['creditRating'], cashFlowRating: jsonData['cashFlowRating'], watchRating: jsonData['watchRating'], ms: jsonData['ms'], rc: jsonData['rc'], 
        msp: jsonData['msp'], mpp: jsonData['mpp'], ssofp: jsonData['ssofp'], cis: jsonData['cis'], sfr: jsonData['sfr'], pr: jsonData['pr'], sr: jsonData['sr'], dr: jsonData['dr'], 
        mc: jsonData['mc'], por: jsonData['por'], es: jsonData['es'], certification: jsonData['certification'] };

    connection.query('UPDATE description SET ?', [obj], (err) => {   
        if (err) {   
            console.log(err);
            res.status(400).json({ 'msg': "error" });
        } else {
            res.status(200).json({ 'msg': "success" });
        }
    });
};
