const router = require('express').Router();
const auth = require('../controllers/auth');

router.post('/login', auth.login);
router.get('/user', auth.getUserInfo);
router.post('/become-creator', auth.becomeCreator);

module.exports = router;
