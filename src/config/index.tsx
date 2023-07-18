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
  'CA6A3ELISQNS5TDBQYBEIAMDLS7VXTKB7PM7CFIXEMNKKIS5SDSH4S6D';
export const VOTES_CONTRACT_ADDRESS: Readonly<string> =
  'CBEJCFTXYG2ZDSLNKTA6DKFTWIEWHHUSD4TQTMR6UJSXZLLGSEYNFEW5';
export const ASSETS_WASM_HASH: Readonly<string> =
  '0d9d69c9071997f1feb8d4cf686f72f8c50f8f3fd9f972d55d8c159c58d3024e';
