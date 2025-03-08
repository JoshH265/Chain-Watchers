import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import walletRoutes from './routes/wallet.routes';
import walletStorageRoutes from './routes/wallet-storage.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount the routes
app.use('/api/wallet-storage', walletStorageRoutes);
app.use('/api/wallet', walletRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});