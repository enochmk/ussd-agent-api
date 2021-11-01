import { Router } from 'express';
import ussd from '../controller/ussd.controller';

const router = Router();

router.route('/biometric-agent').post(ussd).get(ussd);

export default router;
