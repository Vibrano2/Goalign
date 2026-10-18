// client/src/utils/alchemy.js

// Vite exposes environment variables prefixed with VITE_ via import.meta.env
const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

if (!apiKey) {
  console.warn('VITE_ALCHEMY_API_KEY is not set in .env');
}

/**
 * Fetches NFTs for a given wallet address using the Alchemy API.
 * @param {string} ownerAddress - The Ethereum wallet address (e.g., 'vitalik.eth' or '0x...')
 * @returns {Promise<Object>} The API response containing the NFTs
 */
export async function getNFTsForAddress(ownerAddress) {
  if (!apiKey) throw new Error("Alchemy API key is missing");

  const endpoint = `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs/?owner=${ownerAddress}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Alchemy API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch NFTs:', error);
    throw error;
  }
}
