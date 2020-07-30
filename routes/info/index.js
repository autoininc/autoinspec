/* company 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./info.controller');

//파일명 설정
const multer = require("multer");
const path = require('path');
const filePath = path.join(__dirname, '../../public/uploads/')

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, filePath + req.body.path)
    },
    filename: function (req, file, cb) {
        cb(null, new Date().valueOf() + path.extname(file.originalname));
    }
})
const upload = multer({ storage: storage })

router.get('/about', controller.about);
//router.get('/service', controller.service);
router.get('/help', controller.help);
router.get('/qnaForm', controller.qnaForm);
router.post('/qnaAdd', upload.single('file_') ,controller.qnaAdd);

module.exports = router;