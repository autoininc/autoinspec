/* User 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./qna.controller');

//파일명 설정
const multer = require("multer");
const path = require('path');
const filePath = path.join(__dirname, '../../../public/uploads/')

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, filePath + req.body.path)
    },
    filename: function (req, file, cb) {
        cb(null, 'a_' + new Date().valueOf() + path.extname(file.originalname));
    }
})
const upload = multer({ storage: storage })

//1:1문의 관련
router.get('/qnaList', controller.list);
router.get('/view/:id', controller.view);
router.post('/mod/:id', upload.single('file_') ,controller.modify);
router.get('/download/:id', controller.download);
router.get('/sendMail/:qnaId', controller.sendMail);
router.post('/delFile/:id', controller.delFile);

module.exports = router;