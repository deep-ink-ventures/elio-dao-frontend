export const NATIVE_UNITS: Readonly<number> = 10000000000;
export const DAO_UNITS: Readonly<number> = 1000000000000000000; // 13 decimals
export const BLOCK_TIME: Readonly<number> = 5; // seconds
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
  'CDLUQRW6EXSX4SPXC4WTC3SD5KZE2BHDKPMMKJR4FOPGED4NPKKZ4C4Q';
export const VOTES_CONTRACT_ADDRESS: Readonly<string> =
  'CAPYKFOCLMWWLZRHF65RNARHTMALMBNUPT3EITOEGRZ6TYSA3BV43WMV';
