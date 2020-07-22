/* company 라우팅 설정 */
const express = require('express');
const router = express.Router();
const controller = require('./homepage.controller');

//파일명 설정
const multer = require("multer");
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        //cb(null, '/home/hosting_users/autoinspec/apps/autoinspec/public/uploads/')
        cb(null, 'public/uploads');
    },
    filename: function(req, file, cb) {
        var mimeType;

        switch (file.mimetype) {
            case "image/jpeg":
                mimeType = "jpg";
                break;
            case "image/png":
                mimeType = "png";
                break;
            case "image/gif":
                mimeType = "gif";
                break;
            case "image/bmp":
                mimeType = "bmp";
                break;
            default:
                mimeType = "jpg";
                break;
        }
        cb(null, makeid(4) + '_' + Date.now() + "." + mimeType);
    }
})

const upload = multer({ storage: storage })

//파일 이름 랜덤..
function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

//공통
router.post('/modOrder', controller.modOrder);
router.post('/modUseOption/:id', controller.modUseOption);
router.post('/delItem/:id', controller.delItem);

//main 관련 
router.get('/main', controller.main);
router.get('/main/addForm', controller.main_addForm);
router.post('/main/add', upload.single('file-upload-field') ,controller.main_add);
router.get('/main/modForm/:id', controller.main_modForm);
router.post('/main/mod/:id', upload.single('file-upload-field'), controller.main_mod);

//about 관련
router.get('/about', controller.about);
router.post('/about_mod', upload.single('file-upload-field') ,controller.about_mod);

//service 관련
router.get('/service', controller.service);
router.get('/service/addForm', controller.service_addForm);
router.post('/service/add', upload.single('file-upload-field') ,controller.service_add);
router.get('/service/modForm/:id', controller.service_modForm);
router.post('/service/mod/:id', upload.single('file-upload-field'), controller.service_mod);

//help 관련
router.get('/help', controller.help);
router.get('/help/addForm', controller.help_addForm);
router.post('/help/add', controller.help_add);
router.get('/help/modForm/:id', controller.help_modForm);
router.post('/help/mod/:id', controller.help_mod);


module.exports = router;
