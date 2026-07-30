export interface CommissionCalculation {
  grossCommissionCents: number;
  brokerageShareCents: number;
  agentShareCents: number;
  estimatedNetCents: number;
}

const cents = (value: number) => {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Money must be a non-negative integer number of cents");
  return value;
};
const bps = (value: number) => {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) throw new Error("Rate must be between 0 and 10000 basis points");
  return value;
};
export const applyBasisPoints = (amountCents: number, basisPoints: number) =>
  Math.round(cents(amountCents) * bps(basisPoints) / 10_000);

export function calculateCommission(input: {
  transactionAmountCents: number;
  rateBasisPoints?: number;
  flatAmountCents?: number;
  brokerageSplitBasisPoints: number;
  adjustmentsCents?: number[];
}): CommissionCalculation {
  const gross = input.flatAmountCents == null
    ? applyBasisPoints(input.transactionAmountCents, input.rateBasisPoints ?? 0)
    : cents(input.flatAmountCents);
  const brokerage = applyBasisPoints(gross, input.brokerageSplitBasisPoints);
  const agent = gross - brokerage;
  const adjustments = (input.adjustmentsCents ?? []).reduce((sum, item) => {
    if (!Number.isSafeInteger(item)) throw new Error("Adjustment must be integer cents");
    return sum + item;
  }, 0);
  return {
    grossCommissionCents: gross,
    brokerageShareCents: brokerage,
    agentShareCents: agent,
    estimatedNetCents: agent + adjustments,
  };
}
