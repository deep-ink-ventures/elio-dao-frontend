export type Signatory = {
  name: string;
  address: string;
};

export interface RawMultiCliqueAccount {
  name: string;
  address: string;
  signatories: Signatory[];
  default_threshold: number;
  policy: MultiCliquePolicy;
}

export interface MultiCliqueAccount {
  name: string;
  address: string;
  signatories: Signatory[];
  defaultThreshold: number;
  policy: MultiCliquePolicy;
}

export type MultiCliquePolicy = {
  address: string;
  name: string;
  active: boolean;
};

export interface Signature {
  signature: string;
  signatory: Signatory;
}
