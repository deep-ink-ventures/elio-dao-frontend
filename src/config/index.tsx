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
  'CB5ACSKKZ65UTO3S4X5C3PL42H2AG7MMMI25HILB2F7O6JEOF56JETH6';
export const VOTES_CONTRACT_ADDRESS: Readonly<string> =
  'CDKN3BOOKXHS54GTDXJDTMNIMM2AMMO5BW75M3JQFV4OFTWXWLNI6MEV';

export const ASSETS_WASM_HASH: Readonly<string> =
  '45c9f4264bbb82fa74849ec1b8cb03e965ac011f1dc50aff4572268be53c4bf6';
