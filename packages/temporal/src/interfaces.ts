export type ElectronicSignatureProcedureStatus =
    | `PENDING.${
          | 'WAITING_AGREEMENT'
          | 'WAITING_EMAIL'
          | 'GENERATING_CONFIRMATION_CODE'
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
        setEmailForCode(email: string): void;
        validateConfirmationCode(confirmationCode: string): void;
        resendConfirmationCode(): void;
        cancelProcedure(): void;
    };
};
