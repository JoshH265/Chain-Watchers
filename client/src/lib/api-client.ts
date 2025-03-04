const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getTokenMetadata(mintAddresses: string[]) {
  const response = await fetch(`${API_URL}/api/token-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mintAddresses }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch token metadata');
  }
  
  return response.json();
}

export async function getWalletData(address: string) {
  // Change to use GET with path parameter instead of POST with body
  const response = await fetch(`${API_URL}/api/wallet-data/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch wallet data');
  }
  
  return response.json();
}