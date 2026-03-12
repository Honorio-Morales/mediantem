const router = require('express').Router();
const productController = require('../controllers/productController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.get('/:id/related', productController.getRelated);
router.post('/', auth, isAdmin, productController.create);
router.put('/:id', auth, isAdmin, productController.update);
router.delete('/:id', auth, isAdmin, productController.delete);

module.exports = router;
