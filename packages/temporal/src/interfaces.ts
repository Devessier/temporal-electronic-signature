export type ElectronicSignatureProcedureStatus =
    | `PENDING.${
          | 'WATCHING_DOCUMENT'
          | 'WAITING_AGREEMENT'
          | 'SENDING_CONFIRMATION_CODE'
          | 'WAITING_CONFIRMATION_CODE'}`
    | 'EXPIRED'
    | 'VALIDATED'
    | 'CANCELLED';

export type ElectronicSignature = () => {
    execute(): Promise<string>;
    queries: {
        status(): ElectronicSignatureProcedureStatus;
    };
    signals: {
        acceptDocument(): void;
        validateConfirmationCode(confirmationCode: string): void;
        resendConfirmationCode(): void;
        cancelProcedure(): void;
    };
};
