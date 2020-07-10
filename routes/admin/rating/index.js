/* rating 라우팅 설정 */
const express = require('express');
const router = express.Router();
const controller = require('./rating.controller');

//리스트
router.get('/ratingItem/:type', controller.ratingItem);
router.get('/addForm/:type', controller.addForm);
router.post('/add/:type', controller.add);
router.get('/modForm/:id/:type', controller.modForm);
router.post('/mod/:id', controller.mod);


module.exports = router;
