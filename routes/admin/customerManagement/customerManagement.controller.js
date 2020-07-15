const config = require('../../../conf/environments');
const mysql = require('mysql');
const connection = mysql.createConnection(config.info);

exports.list = (req, res) =>
{
    res.render('admin/customerManagement/list',{userObj: req.cookies.userObj});
};

exports.test = (req, res) =>
{
    res.render('admin/customerManagement/managerView');
};
