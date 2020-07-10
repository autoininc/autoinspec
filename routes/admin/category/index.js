/* countries 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./category.controller');

router.get('/list', controller.list);

router.post('/getData/:company_id', controller.getData);
router.post('/getlist', controller.getlist);
router.post('/get1stCategories', controller.get1stCategories);
router.post('/get2ndCategories', controller.get2ndCategories);
router.post('/get3rdCategories', controller.get3rdCategories);

router.get('/addForm', controller.addForm);
router.post('/add', controller.add);
router.post('/modOption', controller.modOption);
router.get('/modForm/:id', controller.modForm);
router.post('/mod/:id', controller.mod);

module.exports = router;