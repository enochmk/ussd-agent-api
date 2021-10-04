const express = require('express');

const menu = require('../controllers/USSD');

const router = express.Router();

router.route('/').get(menu).post(menu);

module.exports = router;
