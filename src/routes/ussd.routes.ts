import { Router } from 'express';
import ussd from '../controller/ussd.controller';
import isAgent from '../middleware/isAgent';

const router = Router();

router.route('/biometric-agent').post(isAgent, ussd).get(isAgent, ussd);

export default router;
