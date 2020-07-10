/* company 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./company.controller');

router.get('/before', controller.list);
router.get('/addForm', controller.addForm);
router.post('/add', controller.add);
router.get('/excelUploadForm', controller.excelUploadForm);
router.post('/excelUpload', controller.excelUpload);
router.get('/modForm/:id', controller.modForm);
router.post('/modify/:id', controller.modify);

router.post('/searchCompany', controller.searchCompany)
router.get('/modalList', controller.modalList);

module.exports = router;