// Mock x402 / CDP payment adapter. Swap with the real x402 middleware or
// CDP client when creds are available. Demo accepts any "signature" string.

export const UNLOCK_PRICE_USDC = 1.0;

export interface PaymentReceipt {
  id: string;
  jobId: string;
  amountUsdc: number;
  payer: string;
  signature: string;
  settledAt: string;
}

const receipts = new Map<string, PaymentReceipt>();

export async function settle(jobId: string, payer: string, signature: string): Promise<PaymentReceipt> {
  await sleep(300);
  if (!signature || signature.length < 6) throw new Error("invalid signature");
  const receipt: PaymentReceipt = {
    id: `rcpt_${Math.random().toString(36).slice(2, 10)}`,
    jobId,
    amountUsdc: UNLOCK_PRICE_USDC,
    payer,
    signature,
    settledAt: new Date().toISOString(),
  };
  receipts.set(jobId, receipt);
  return receipt;
}

export function receiptFor(jobId: string): PaymentReceipt | undefined {
  return receipts.get(jobId);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
