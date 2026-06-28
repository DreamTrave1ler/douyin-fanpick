const router = require('express').Router();
const want = require('../controllers/want');

router.post('/', want.addWant);
router.delete('/', want.removeWant);
router.get('/rank', want.getRank);
router.get('/mine', want.getMyWants);

module.exports = router;
