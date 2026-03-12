const router = require('express').Router();
const forumController = require('../controllers/forumController');
const auth = require('../middlewares/auth');

router.get('/', forumController.getAll);
router.get('/:id', forumController.getById);
router.post('/', auth, forumController.create);
router.post('/:id/reply', auth, forumController.reply);
router.delete('/:id', auth, forumController.delete);

module.exports = router;
