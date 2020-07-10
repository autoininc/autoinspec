/* countries 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./countries.controller');

router.get('/list', controller.list);
router.post('/add', controller.add);
router.post('/getdata', controller.getData);
router.post('/modify', controller.modify);
router.post('/modOption', controller.modOption);

module.exports = router;