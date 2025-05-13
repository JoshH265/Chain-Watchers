import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import walletRoutes from './routes/wallet.routes';
import walletStorageRoutes from './routes/wallet-storage.routes';
import walletProfileRoutes from './routes/wallet-profile.routes';
import transactionHistoryRoutes from './routes/transaction-history.routes';
import cryptoPriceRoutes from './routes/crypto-price.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount the routes
app.use('/api/wallet-storage', walletStorageRoutes);
app.use('/api/wallet-data', walletRoutes);
app.use('/api/wallet-profile', walletProfileRoutes);
app.use('/api/transaction-history', transactionHistoryRoutes);
app.use('/api/crypto-price', cryptoPriceRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});