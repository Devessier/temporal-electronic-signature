export * from './workflows';

export type ElectronicSignatureProcedureStatus =
    | `PENDING.${
          | 'WAITING_AGREEMENT'
          | 'WAITING_EMAIL'
          | 'GENERATING_CONFIRMATION_CODE'
          | 'SENDING_CONFIRMATION_CODE'
          | 'WAITING_CONFIRMATION_CODE'
          | 'SIGNING_DOCUMENT'}`
    | 'EXPIRED'
    | 'VALIDATED'
    | 'CANCELLED';
