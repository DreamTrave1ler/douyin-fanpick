const router = require('express').Router();
const product = require('../controllers/product');

router.get('/', product.getProducts);
router.get('/search', product.searchProducts);
router.get('/:id', product.getProductDetail);
router.post('/', product.addProduct);
router.post('/batch', product.batchAddProducts);
router.put('/:id', product.updateProduct);
router.delete('/:id', product.deleteProduct);

module.exports = router;
