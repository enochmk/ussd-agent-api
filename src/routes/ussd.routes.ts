import { Router } from 'express';
import ussd from '../controller/ussd.controller';
import isAgent from '../middleware/isAgent';
import assignID from '../middleware/assignID';

const router = Router();

router
	.route('/biometric-agent')
	.post(assignID, isAgent, ussd)
	.get(assignID, isAgent, ussd);

export default router;
