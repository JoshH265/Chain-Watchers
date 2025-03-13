const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getTokenMetadata(mintAddresses: string[]) {
  const response = await fetch(`${API_URL}/api/wallet-data/token-metadata`, {
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
// In api-client.ts
export async function getWalletData(address: string) {
  const response = await fetch(`${API_URL}/api/wallet-data/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch wallet data');
  }
  
  return response.json();
}

export async function getStoredWallets() {
  const response = await fetch(`${API_URL}/api/wallet-storage`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch stored wallets');
  }
  
  return response.json();
}

export async function addWalletToStorage(data: { address: string, label?: string, tags?: string[] }) {
  const response = await fetch(`${API_URL}/api/wallet-storage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to add wallet to storage');
  }
  
  return response.json();
}

export async function removeWalletFromStorage(address: string) {
  const response = await fetch(`${API_URL}/api/wallet-storage/${address}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove wallet from storage');
  }
  
  return response.json();
}