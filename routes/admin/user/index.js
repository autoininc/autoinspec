/* company 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./user.controller');

router.get('/all', controller.list);
router.post('/changeLevel/:id', controller.changeLevel);
router.post('/sendCoin/:id', controller.sendCoin);

router.get('/view/:id', controller.view);
router.get('/recently/:id', controller.recently);
router.get('/purchase_company/:id', controller.purchase_company);
router.get('/purchase_credit/:id', controller.purchase_credit);
router.get('/subscription/:id', controller.subscription);
router.get('/coin/:id', controller.coin);
router.get('/payment/:id', controller.payment);
router.get('/qna/:id', controller.qna);

router.delete('/delItem/:id', controller.delItem);

module.exports = router;