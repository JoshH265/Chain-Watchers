import { Request, Response } from 'express';
import { getWalletTransactionHistory } from '../services/transaction-history-service';


// Controller handles HTTP requests, acts as middleman between client and service layer
export async function getTransactionHistory(req: Request, res: Response) {
  try {
    const { address } = req.params; // Get wallet from request path 
    
    // Extract query params from the request for filtering and pagination
    const { limit, before, after, cursor, minSolAmount, minTokenAmount } = req.query;
    
    console.log('Transaction history request params:', { 
      address, limit, before, after, cursor, minSolAmount, minTokenAmount 
    });
    
    /**
     * Set parameters for the transaction history service request
     * Extract and convert params from strings to needed types
     * Extracted parms send via express
     */
    const result = await getWalletTransactionHistory(address, {
      limit: limit ? parseInt(limit as string) : undefined,
      before: before as string | undefined,
      after: after as string | undefined,
      cursor: cursor as string | undefined,
      minSolAmount: minSolAmount ? parseFloat(minSolAmount as string) : undefined,
      minTokenAmount: minTokenAmount ? parseFloat(minTokenAmount as string) : undefined
    });
    
    // Return the result as JSON via express
    res.json(result);
  } catch (error) {
    console.error('Error in getTransactionHistory controller:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction history',
      message: (error as Error).message
    });
  }
}