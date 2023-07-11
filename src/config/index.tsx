export const DAO_UNITS: Readonly<number> = 1000000000000000000; // 18 decimals
export const BLOCK_TIME: Readonly<number> = 6; // seconds
export const XLM_UNITS: Readonly<number> = 10000000; // 7 decimals

export const NETWORK_PASSPHRASE: Readonly<string> =
  'Test SDF Future Network ; October 2022';
export const NETWORK: Readonly<string> = 'FUTURENET';
export const BASE_FEE: Readonly<string> = '100';

export const SOROBAN_RPC_ENDPOINT: Readonly<string> =
  process.env.RPC_ENDPOINT || 'https://rpc-futurenet.stellar.org/';
export const SERVICE_URL: Readonly<string> =
  process.env.SERVICE_URL || 'https://service.elio-dao.org';

export const CORE_CONTRACT_ADDRESS: Readonly<string> =
  'CBWNAXL3V65N4GBLUNITC3UARMGX2UGG4CSBI3YOQGNALVY3UST5O4KN';
export const VOTES_CONTRACT_ADDRESS: Readonly<string> =
  'CAK7J7D3V4IZJZKDTOUJFBVUVUDE7FZIAFXRKMOZ6V3FCK5H4YDSH42M';
export const ASSETS_WASM_HASH: Readonly<string> =
  '5b41729a64d2fe17ac068425afabe0c0f69f3cd5cf596e1097eebdaf042591cb';
