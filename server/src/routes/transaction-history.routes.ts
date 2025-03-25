import { Router } from 'express';
import { getTransactionHistory } from '../controllers/transaction-history.controller';

const router = Router();

/**
 * @route GET /api/transaction-history/transactions/:address
 * @description Get transaction history for a wallet
 * @param address Wallet address
 * @query limit Number of transactions to return (default: 100)
 * @query before Filter transactions before this date (ISO string)
 * @query after Filter transactions after this date (ISO string)
 * @query cursor Pagination cursor for fetching next set of results
 */
router.get('/transactions/:address', getTransactionHistory);

export default router;