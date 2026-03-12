const router = require('express').Router();
const statsController = require('../controllers/statsController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/overview', auth, isAdmin, statsController.getOverview);
router.get('/sales', auth, isAdmin, statsController.getSales);
router.get('/top-products', auth, isAdmin, statsController.getTopProducts);

module.exports = router;
