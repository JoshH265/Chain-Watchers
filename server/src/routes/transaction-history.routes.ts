import { Router } from 'express';
import { getTransactionHistory } from '../controllers/transaction-history.controller';

const router = Router();

router.get('/transactions/:address', getTransactionHistory);

export default router;



