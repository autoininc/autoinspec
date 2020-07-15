const express = require('express');
const router = express.Router();

const controller = require('./customerManagement.controller');

router.get('/list',controller.list);
router.get('/managerView',controller.test);



module.exports = router;