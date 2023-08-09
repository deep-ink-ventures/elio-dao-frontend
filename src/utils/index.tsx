import { DAO_UNITS, XLM_UNITS } from '@/config';
import BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';
import { scValToNative } from 'soroban-client';

// @ts-ignore
export const truncateMiddle = (str?, start = 4, end = 4) => {
  if (str && str.length) {
    if (str.length <= start + end) {
      return str;
    }
    return `${str.substring(0, start)}...${
      end > 0 ? str.substring(str.length - end) : ''
    }`;
  }
  return '';
};

export const readFileAsB64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result?.toString().split(',')[1];
      if (b64) {
        resolve(b64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

export function hexToBase64(hexStr: string) {
  let base64 = '';
  for (let i = 0; i < hexStr.length; i += 1) {
    // eslint-disable-next-line
    base64 += !((i - 1) & 1)
      ? String.fromCharCode(parseInt(hexStr.substring(i - 1, i + 1), 16))
      : '';
  }
  return window.btoa(base64);
}

export const getProposalEndTime = (
  currentNumber: number,
  startNumber: number,
  durationNumber: number
) => {
  const leftOverNumber = durationNumber - (currentNumber - startNumber);

  const seconds = leftOverNumber * 6;
  const day = Math.floor(seconds / (3600 * 24));
  const hour = Math.floor((seconds % (3600 * 24)) / 3600);
  const minute = Math.floor((seconds % 3600) / 60);

  const d = day > 0 ? day : 0;
  const h = hour > 0 ? hour : 0;
  const m = minute > 0 ? minute : 0;

  return {
    d,
    h,
    m,
  };
};

// eslint-disable-next-line
export const uiTokens = (
  rawAmount: BigNumber | null,
  tokenType?: 'xlm' | 'dao',
  unitName?: string
) => {
  const units = tokenType === 'xlm' ? XLM_UNITS : DAO_UNITS;
  const fmt = {
    prefix: '',
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: '',
  };

  BigNumber.config({ FORMAT: fmt });
  const formatted = rawAmount
    ? rawAmount.dividedBy(units).toFormat(0)
    : new BigNumber(0)?.toFormat(0);

  return `${formatted} ${unitName}`;
};

export const formatTokenAmount = (amount: BigNumber, decimals: number) => {
  let formatted = amount.shiftedBy(-decimals).toFixed(decimals).toString();

  // Trim trailing zeros
  while (formatted[formatted.length - 1] === '0') {
    formatted = formatted.substring(0, formatted.length - 1);
  }

  if (formatted.endsWith('.')) {
    formatted = formatted.substring(0, formatted.length - 1);
  }
  return formatted;
};

export const accountToScVal = (account: string) =>
  new SorobanClient.Address(account).toScVal();

export const decodeBytesN = (xdr: string) => {
  const val = SorobanClient.xdr.ScVal.fromXDR(xdr, 'base64');
  return val.bytes().toString();
};

export const stringToScVal = (str: string): SorobanClient.xdr.ScVal => {
  const b = Buffer.from(str);
  const scVal = SorobanClient.xdr.ScVal.scvBytes(b);
  return scVal;
};

export const numberToBuffer = (num: number) => {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(num, 0);
  return buffer;
};

export const numberToScVal = (num: number): SorobanClient.xdr.ScVal => {
  const b = numberToBuffer(num);
  const scVal = SorobanClient.xdr.ScVal.scvBytes(b);
  return scVal;
};

export const isStellarPublicKey = (publicKey: string) => {
  return SorobanClient.StrKey.isValidEd25519PublicKey(publicKey);
};

export const daoIdToAssetSaltScVal = (
  daoId: string
): SorobanClient.xdr.ScVal => {
  let buffer = Buffer.from(daoId, 'utf8');

  if (buffer.length < 32) {
    const padding = Buffer.alloc(32 - buffer.length);
    buffer = Buffer.concat([buffer, padding]);
  } else if (buffer.length > 32) {
    buffer = buffer.subarray(0, 32);
  }

  return SorobanClient.xdr.ScVal.scvBytes(buffer);
};

export const hexToScVal = (hexString: string): SorobanClient.xdr.ScVal => {
  if (hexString.length !== 64) {
    throw new Error(
      'Input string must be 64 characters (32 bytes in hexadecimal format)'
    );
  }

  return SorobanClient.xdr.ScVal.scvBytes(Buffer.from(hexString, 'hex'));
};

// copied from https://github.com/stellar/soroban-react-payment/blob/main/src/helpers/soroban.ts

export const bigNumberFromBytes = (
  signed: boolean,
  ...bytes: (string | number | bigint)[]
): BigNumber => {
  let sign = 1;
  if (signed && bytes[0] === 0x80) {
    // top bit is set, negative number.
    sign = -1;
    // eslint-disable-next-line
    bytes[0] &= 0x7f;
  }
  // eslint-disable-next-line
  let b = BigInt(0);
  // eslint-disable-next-line
  for (const byte of bytes) {
    b <<= BigInt(8);
    b |= BigInt(byte);
  }
  return BigNumber(b.toString()).multipliedBy(sign);
};

// Helper used in SCVal conversion
export const bigintToBuf = (bn: bigint): Buffer => {
  let hex = BigInt(bn).toString(16).replace(/^-/, '');
  if (hex.length % 2) {
    hex = `0${hex}`;
  }

  const len = hex.length / 2;
  const u8 = new Uint8Array(len);

  let i = 0;
  let j = 0;
  while (i < len) {
    u8[i] = parseInt(hex.slice(j, j + 2), 16);
    i += 1;
    j += 2;
  }

  if (bn < BigInt(0)) {
    // Set the top bit
    u8[0] |= 0x80;
  }

  return Buffer.from(u8);
  // return toBufferBE(bn, 16)
};

// Can be used whenever you need an i128 argument for a contract method
export const bigNumberToScVal = (
  bigNum: BigNumber
): SorobanClient.xdr.ScVal => {
  const b: bigint = BigInt(bigNum.toFixed(0));
  const buf = bigintToBuf(b);
  if (buf.length > 16) {
    throw new Error('BigNumber overflows i128');
  }

  if (bigNum.isNegative()) {
    // Clear the top bit. Valid but we don't need negative number here for our purpose
    throw new Error('big number is negative');
  }

  // left-pad with zeros up to 16 bytes
  const padded = Buffer.alloc(16);
  buf.copy(padded, padded.length - buf.length);
  console.debug({ value: bigNum.toString(), padded });

  if (bigNum.isNegative()) {
    // Set the top bit
    padded[0] |= 0x80;
  }

  // fixme?
  const hi = new SorobanClient.xdr.Int64([
    bigNumberFromBytes(false, ...padded.subarray(4, 8)).toNumber(),
    bigNumberFromBytes(false, ...padded.subarray(0, 4)).toNumber(),
  ]);
  const lo = new SorobanClient.xdr.Uint64([
    bigNumberFromBytes(false, ...padded.subarray(12, 16)).toNumber(),
    bigNumberFromBytes(false, ...padded.subarray(8, 12)).toNumber(),
  ]);

  return SorobanClient.xdr.ScVal.scvI128(
    new SorobanClient.xdr.Int128Parts({ lo, hi })
  );
};

// fixme add more val type decoders
export const decodeXdr = (xdr: string) => {
  const scVal = SorobanClient.xdr.ScVal.fromXDR(xdr as string, 'base64');
  switch (scVal.switch().name) {
    case 'scvAddress':
      return SorobanClient.Address.fromScAddress(scVal.address()).toString();
    case 'scvBytes':
      return scVal.bytes().toString();
    case 'scvMap':
      return scVal.map()?.map((item) => {
        if (item.val().switch().name === 'scvBytes') {
          return item.val().bytes().toString();
        }
        if (item.val().switch().name === 'scvAddress') {
          SorobanClient.Address.fromScAddress(item.val().address());
          return SorobanClient.Address.fromScAddress(
            item.val().address()
          ).toString();
        }
        return item;
      });
    case 'scvU32':
      return scVal.u32();
    default: {
      const val = scValToNative(scVal);
      return val;
    }
  }
};

export const camelToSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);

export const bigNumberToI128ScVal = (number: BigNumber) => {
  const integer = number.integerValue().toFixed(0).toString();
  // const decimals = number.minus(integer).toFixed();

  const integerBigInt = BigInt(integer);
  // const decimalsBigInt = BigInt(decimals.replace('.', ''));

  const value = BigInt(integerBigInt.toString());

  const scInt = new SorobanClient.ScInt(value);

  return scInt.toI128();
};

export const numberToU32ScVal = (number: number) => {
  return SorobanClient.xdr.ScVal.scvU32(number);
};

export const splitCamelCase = (str: string): string => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const currentChar = str[i];
    if (currentChar === currentChar?.toUpperCase()) {
      result += ' ';
    }
    result += currentChar;
  }
  return result.trim();
};
