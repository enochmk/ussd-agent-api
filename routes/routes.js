const express = require('express');

const menu = require('../controllers/USSD');
const devMode = require('../middleware/devMode');
const isAgent = require('../middleware/isAgent');
const sessionExpiry = require('../middleware/sessionExpiry');

const router = express.Router();

router
	.route('/')
	.get(devMode, isAgent, sessionExpiry, menu)
	.post(devMode, isAgent, sessionExpiry, menu);

module.exports = router;
