/* User 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./pass.controller');

//subscription
router.get('/index', controller.index);

//subscription -> 결제창
router.post('/selMethod', controller.selMethod);
router.post('/paypalCreate',controller.paypalCreate);
router.get('/success',controller.success);
router.post('/transferCreate',controller.transferCreate);
router.post('/processWireTransfer',controller.processWireTransfer);


//coin
router.get('/coin', controller.coin);
router.post('/selMethod_coin', controller.selMethod_coin);
router.post('/transferCreate_coin',controller.transferCreate_coin);
router.post('/processWireTransfer_coin',controller.processWireTransfer_coin);


//paypal-router
router.post('/paypalCreate_coin',controller.paypalCreate_coin);
router.get('/success_coin',controller.success_coin);

router.post('/useCoin', controller.useCoin);
router.post('/cancelRequest/:id', controller.cancelRequest);
router.post('/cancel/:id', controller.cancel);

router.get('/getSubscriptionData/:id', controller.getSubscriptionData);
router.get('/getCointData/:id', controller.getCointData)

//승인!
router.post('/approval/:id', controller.approval);

//보너스 보내기
router.post('/sendBonusCoin/:id/:coin', controller.sendBonusCoin);

//유효기간 체크후 소멸시키기
router.post('/checkExpiredDate/:id', controller.checkExpiredDate);

//현재 이용중인 subscription 가져오기
router.post('/getCurrentSubscription/:id', controller.getCurrentSubscription);

module.exports = router;