import { Request, Response } from 'express';
import { getWalletTransactionHistory } from '../services/transaction-history-service';


export async function getTransactionHistory(req: Request, res: Response) {
  try {
    const { address } = req.params;
    const { limit, before, after, cursor, minSolAmount, minTokenAmount } = req.query;
    
    // Log what parameters we're receiving from the frontend
    console.log('Transaction history request params:', { 
      address, limit, before, after, cursor, minSolAmount, minTokenAmount 
    });
    
    const result = await getWalletTransactionHistory(address, {
      limit: limit ? parseInt(limit as string) : undefined,
      before: before as string | undefined,
      after: after as string | undefined,
      cursor: cursor as string | undefined,
      minSolAmount: minSolAmount ? parseFloat(minSolAmount as string) : undefined,
      minTokenAmount: minTokenAmount ? parseFloat(minTokenAmount as string) : undefined
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error in getTransactionHistory controller:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction history',
      message: (error as Error).message
    });
  }
}