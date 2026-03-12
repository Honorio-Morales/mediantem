const router = require('express').Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middlewares/auth');

router.get('/:productId', reviewController.getByProduct);
router.get('/:productId/summary', reviewController.getSummary);
router.post('/', auth, reviewController.create);

module.exports = router;
