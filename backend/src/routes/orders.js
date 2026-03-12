const router = require('express').Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.post('/', auth, orderController.create);
router.get('/mine', auth, orderController.getMyOrders);
router.get('/:id', auth, orderController.getById);
router.get('/', auth, isAdmin, orderController.getAll);
router.patch('/:id/status', auth, isAdmin, orderController.updateStatus);

module.exports = router;
