/* company 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./payment.controller');

//subscription 항목 관리
router.get('/subscriptionitem', controller.subscriptionitem);
router.get('/subscriptionitem/addForm', controller.subscriptionitem_addForm);
router.post('/subscriptionitem/add', controller.subscriptionitem_add);
router.get('/subscriptionitem/modForm/:id', controller.subscriptionitem_modForm);
router.post('/subscriptionitem/mod/:id', controller.subscriptionitem_mod);

router.get('/coinitem', controller.coinitem);

router.get('/wireTransfer_setting', controller.wireTransfer_setting);
router.post('/modWireTransfer_setting', controller.modWireTransfer_setting);

router.get('/paymentList', controller.list);
router.get('/waitingList', controller.waitingList);
router.post('/changeStatus/:id', controller.changeStatus);

module.exports = router;