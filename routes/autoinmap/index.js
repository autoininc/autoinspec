const express = require('express');
const router = express.Router();

const controller = require('./autoinmap.controller');


router.get('/autoinmap', controller.autoinmap);
router.post('/getcategory', controller.getCategory);

module.exports = router;