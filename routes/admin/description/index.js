/* company 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./description.controller');


router.get('/view_description', controller.view);
router.post('/mod', controller.mod);

module.exports = router;