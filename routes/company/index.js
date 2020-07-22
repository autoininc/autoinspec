/* company 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./company.controller');

router.get('/mainsearch',controller.test);
router.get('/search', controller.search);

router.get('/detail/:id', controller.detail);

router.get('/detail_before_/:id/:detailYN/:auth_rm/:auth_component', controller.detail_before_);
router.get('/detail_pay/:id/:currency_id', controller.detail_pay);
router.get('/detailC_pay/:id/:currency_id', controller.detailC_pay);
router.get('/detailN_pay/:id', controller.detailN_pay);

router.get('/modalList', controller.modalList);
router.get('/modalView/:id', controller.modalView);

module.exports = router;