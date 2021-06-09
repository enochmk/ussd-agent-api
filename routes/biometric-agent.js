const express = require('express');

const controller = require('../controllers/v1/biometric-agent');

const router = express.Router();

/**
|--------------------------------------------------
| @route 				
|	@params				
| @description 	
|	@access 			
|--------------------------------------------------
*/
router.route('/').get(controller).post(controller);

module.exports = router;
