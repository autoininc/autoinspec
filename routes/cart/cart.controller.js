const config = require('../../conf/environments');
const mysql = require('sync-mysql'); //원래 javascript는 비동기인데 sync-mysql로 동기 설정 가능
var connection = new mysql(config.info);

exports.list = (req, res) => {
    res.render('cart/list',{userObj: req.cookies.userObj});
}