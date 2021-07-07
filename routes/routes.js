const express = require('express');

const menu = require('../controllers/agentMenu');

const router = express.Router();

router.route('/').get(menu).post(menu);

module.exports = router;
