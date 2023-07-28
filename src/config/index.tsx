export const DAO_UNITS: Readonly<number> = 1000000000000000000; // 18 decimals
export const BLOCK_TIME: Readonly<number> = 6; // seconds
export const XLM_UNITS: Readonly<number> = 10000000; // 7 decimals

export const NETWORK_PASSPHRASE: Readonly<string> =
  'Standalone Network ; February 2017';
export const NETWORK: Readonly<string> = 'FUTURENET';
export const BASE_FEE: Readonly<string> = '100';

export const SOROBAN_RPC_ENDPOINT: Readonly<string> =
  process.env.RPC_ENDPOINT || 'https://node.elio-dao.org/soroban/rpc/';
export const SERVICE_URL: Readonly<string> =
  process.env.SERVICE_URL || 'https://service.elio-dao.org';
