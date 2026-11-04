export type ErrorKind = 'ValidationError' | 'NotFound' | 'InvariantViolation';

/** The closed set of failures. `code` is stable and part of the contract, so copy can be written against it. */
export class DomainError extends Error {
  readonly kind: ErrorKind;
  readonly code: string;

  constructor(kind: ErrorKind, code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.kind = kind;
    this.code = code;
  }
}

export const invariantViolation = (code: string, message: string) =>
  new DomainError('InvariantViolation', code, message);
export const notFound = (code: string, message: string) => new DomainError('NotFound', code, message);
