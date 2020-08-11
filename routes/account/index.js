/* User 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./account.controller');

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

router.get('/setting', controller.setting);
router.get('/password', controller.password);

router.post('/password', controller.changePassword);
router.post('/modCurrency', controller.modCurrency);

router.get('/wishList', controller.wishlist);
router.post('/deletewishlist',controller.deletewishlist);

router.get('/transactions', controller.transactions);
router.get('/payList', controller.payList);
router.get('/subscriptionList', controller.subscriptionList);

router.get('/purchaseList', controller.purchaseList);
router.get('/creditReportList', controller.creditReportList);


//1:1문의 관련
router.get('/qna/list', controller.qnaList);
router.get('/qna/view/:id', controller.qnaView);
router.get('/qna/download/:id', controller.download);
router.get('/qna/answerDownload/:id', controller.answerDownload);
router.get('/qna/modForm/:id', controller.qnaModForm);
router.post('/qna/delFile/:id', controller.qnaDelFile);
router.post('/qna/mod', upload.single('file_') ,controller.qnaMod);
router.post('/qna/del/:id', controller.qnaDel);


module.exports = router;