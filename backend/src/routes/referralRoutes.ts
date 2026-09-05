import { Router } from 'express';
import { ReferralController } from '../controllers/referralController.js';

export const referralRoutes = Router();

referralRoutes.get('/', ReferralController.getReferrals);
referralRoutes.post('/claim', ReferralController.claimBonus);
