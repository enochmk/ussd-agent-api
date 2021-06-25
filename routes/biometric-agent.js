const express = require('express');

const controller = require('../controllers/biometric-agent');

const router = express.Router();

router.route('/').get(controller).post(controller);

module.exports = router;
