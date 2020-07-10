/* User 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./creditReport.controller');

//파일명 설정
const multer = require("multer");
const path = require('path');
const filePath = path.join(__dirname, '../../../public/uploads/')

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, filePath + req.body.path)
    },
    filename: function (req, file, cb) {
        cb(null, new Date().valueOf() + path.extname(file.originalname));
    }
})
const upload = multer({ storage: storage })

//1:1문의 관련
router.get('/reportList', controller.list);
router.get('/view/:id', controller.view);
router.post('/mod/:id', upload.single('file_') ,controller.modify);
router.get('/delFile/:id', controller.delFile);
router.get('/sendMail/:id', controller.sendMail);

module.exports = router;