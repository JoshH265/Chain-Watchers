import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import walletRoutes from './routes/wallet.routes';
import walletStorageRoutes from './routes/wallet-storage.routes';
import walletProfileRoutes from './routes/wallet-profile.routes';
import tokenMetadataRoutes from './routes/token-metadata.routes';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount the routes
app.use('/api/wallet-storage', walletStorageRoutes);
app.use('/api/wallet-data', walletRoutes);
app.use('/api/wallet-profile', walletProfileRoutes);
app.use('/api/token-metadata', tokenMetadataRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});