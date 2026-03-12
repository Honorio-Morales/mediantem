const router = require('express').Router();
const wishlistController = require('../controllers/wishlistController');
const auth = require('../middlewares/auth');

router.get('/', auth, wishlistController.get);
router.post('/', auth, wishlistController.add);
router.delete('/:productId', auth, wishlistController.remove);

module.exports = router;
