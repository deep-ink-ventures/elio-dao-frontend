import type BigNumber from 'bignumber.js';
import * as SorobanClient from 'soroban-client';

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
export const uiTokens = (rawAmount: BigNumber | null, tokenType?: 'native' | 'dao', unitName?: string) => {

  // const units = tokenType === 'native' ? NATIVE_UNITS : DAO_UNITS

  // formatBalance.setDefaults({ decimals: 0, unit: unitName || 'UNITS'});

  // return formatBalance(rawAmount?.div(new BN(units) || new BN(0)).toString(),{
  //   forceUnit: unitName,
  //   withZero: false,
  // } )
  return `${rawAmount?.toString()} Units`;
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

export const stringToScVal = (str: string) => {
  const b = Buffer.from(str);
  const scVal = SorobanClient.xdr.ScVal.scvBytes(b);
  return scVal;
};
