declare module '@paystack/inline-js' {
  export default class PaystackPop {
    constructor();
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;
      currency?: string;
      ref?: string;
      callback?: (response: { reference: string; status?: string; trans?: string; transaction?: string; message?: string }) => void | Promise<void>;
      onSuccess?: (response: { reference: string; status?: string; trans?: string; transaction?: string; message?: string }) => void | Promise<void>;
      onClose?: () => void;
      [key: string]: any;
    }): void;
    [key: string]: any;
  }
}
