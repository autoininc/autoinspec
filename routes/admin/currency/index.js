/* field 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./currency.controller');

router.get('/list', controller.list);
router.get('/addForm', controller.addForm);
router.post('/add', controller.add);
router.get('/modForm/:id', controller.modForm);
router.post('/mod/:id', controller.mod);
router.post('/modDefault', controller.modDefault);
router.delete('/delItem/:id', controller.delItem);


module.exports = router;