import { Router } from 'express';
import { scheduleEmail, getScheduledEmails } from './email.controller';
import { createSender, listSenders } from './sender.controller';

const router = Router();

router.post('/senders', createSender);
router.get('/senders', listSenders);
router.post('/schedule', scheduleEmail);
router.get('/scheduled', getScheduledEmails);

export default router;
