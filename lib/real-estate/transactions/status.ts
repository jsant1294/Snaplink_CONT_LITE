import type { TransactionStatus } from "./types";

const TRANSITIONS: Record<TransactionStatus, readonly TransactionStatus[]> = {
  draft: ["active", "cancelled"],
  active: ["offer_submitted", "cancelled"],
  offer_submitted: ["offer_accepted", "cancelled"],
  offer_accepted: ["due_diligence", "cancelled"],
  due_diligence: ["inspection", "cancelled"],
  inspection: ["financing", "cancelled"],
  financing: ["appraisal", "cancelled"],
  appraisal: ["clear_to_close", "cancelled"],
  clear_to_close: ["closed", "cancelled"],
  closed: [],
  cancelled: [],
};

export class InvalidTransactionTransitionError extends Error {
  constructor(from: TransactionStatus, to: TransactionStatus) {
    super(`Transaction cannot transition from ${from} to ${to}`);
    this.name = "InvalidTransactionTransitionError";
  }
}

export function allowedTransactionTransitions(status: TransactionStatus) {
  return TRANSITIONS[status];
}

export function canTransitionTransaction(from: TransactionStatus, to: TransactionStatus) {
  return from === to || TRANSITIONS[from].includes(to);
}

export function assertTransactionTransition(from: TransactionStatus, to: TransactionStatus) {
  if (!canTransitionTransaction(from, to)) throw new InvalidTransactionTransitionError(from, to);
}

export function isTransactionReadOnly(status: TransactionStatus) {
  return status === "closed";
}
