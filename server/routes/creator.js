const router = require('express').Router();
const creator = require('../controllers/creator');

router.get('/dashboard', creator.getDashboard);
router.get('/trend', creator.getTrend);
router.get('/products', creator.getMyProducts);
router.get('/votes/:product_id', creator.getFanVotes);

module.exports = router;
