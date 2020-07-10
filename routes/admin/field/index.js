/* field 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./field.controller');

router.get('/list', controller.list);
router.post('/add', controller.add);
router.post('/getdata', controller.getData);

router.post('/modOrder', controller.modOrder);
router.post('/modUseOption', controller.modUseOption);
router.post('/modify', controller.modify);

module.exports = router;