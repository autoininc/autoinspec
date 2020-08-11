/* User 라우팅 설정 */
const express = require('express');
const router = express.Router();

const controller = require('./user.controller');

router.get('/login', controller.login);
router.post('/login', controller.goLogin);

router.get('/sign_up', controller.sign_up);
router.post('/sign_up', controller.gosign_up);

router.get('/forgotPassword', controller.forgotPassword);
router.post('/createNewPassword', controller.createNewPassword);

router.get('/confirmEmail', controller.confirmEmail);

router.get('/logout', controller.logout);

router.post('/loginCheck', controller.loginCheck);

router.post('/wishList', controller.wishList);
module.exports = router;