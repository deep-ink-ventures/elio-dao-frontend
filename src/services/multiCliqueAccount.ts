import { SERVICE_URL } from '@/config';
import type {
  MultiCliqueAccount,
  RawMultiCliqueAccount,
} from '@/types/multiCliqueAccount';
import { keysToCamelCase, keysToSnakeCase } from '@/utils/transformer';

export const createMultiCliqueAccount = async (
  payload: MultiCliqueAccount
): Promise<MultiCliqueAccount> => {
  const body = JSON.stringify(keysToSnakeCase(payload));

  const response = await fetch(`${SERVICE_URL}/multiclique/accounts/`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const objResponse: RawMultiCliqueAccount = await response.json();

  const formattedMultiCliqueAccount = keysToCamelCase(objResponse);

  return formattedMultiCliqueAccount;
};

export const McAccountService = {
  createMultiCliqueAccount,
};
