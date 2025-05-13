'use client'

import { useTokenPrices } from '@/hooks/token-price-hook';

export default function CryptoPrices() {
  const { solPrice, btcPrice, isLoading } = useTokenPrices();
  
  if (isLoading) {
    return <span className="text-sm">Loading prices...</span>;
  }

  return (
    <div className="flex space-x-4 text-sm">
      <span>SOL: ${solPrice !== null ? solPrice.toFixed(2) : '-.--'}</span>
      <span>BTC: ${btcPrice !== null ? btcPrice.toLocaleString() : '-.--'}</span>
    </div>
  );
}