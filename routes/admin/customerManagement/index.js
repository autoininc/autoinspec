const express = require('express');
const router = express.Router();

const controller = require('./customerManagement.controller');

router.get('/list',controller.list);
router.post('/add', controller.add);
router.get('/consult',controller.consultForm);
router.post('/getconsult',controller.getdata);
router.post('/modifyconsult',controller.modify);
router.post('/deleteconsult',controller.delete);
router.post('/managerModify',controller.modifyManager);
router.post('/managerAdd',controller.addManager);
module.exports = router;