import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import walletRoutes from './routes/wallet.routes';

dotenv.config();
console.log('API Key from index.ts:', !!process.env.HELIUS_API_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount the routes with the /api prefix
app.use('/api', walletRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});