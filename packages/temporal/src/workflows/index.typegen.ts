// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
    '@@xstate/typegen': true;
    internalEvents: {
        'xstate.after(120000)#electronicSignatureMachine.pendingSignature': {
            type: 'xstate.after(120000)#electronicSignatureMachine.pendingSignature';
        };
        'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]': {
            type: 'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]';
            data: unknown;
            __tip: 'See the XState TS docs to learn how to strongly type this.';
        };
        'xstate.init': { type: 'xstate.init' };
    };
    invokeSrcNameMap: {
        generateConfirmationCode: 'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]';
        sendConfirmationCode: 'done.invoke.electronicSignatureMachine.pendingSignature.sendingConfirmationCode:invocation[0]';
        signDocument: 'done.invoke.electronicSignatureMachine.pendingSignature.signingDocument:invocation[0]';
    };
    missingImplementations: {
        actions:
            | 'assignEmail'
            | 'assignConfirmationCode'
            | 'incrementSendingConfirmationCodeTries'
            | 'resetConfirmationCode';
        services:
            | 'generateConfirmationCode'
            | 'sendConfirmationCode'
            | 'signDocument';
        guards:
            | 'isConfirmationCodeCorrect'
            | 'hasNotReachedConfirmationCodeSendingLimit';
        delays: never;
    };
    eventsCausingActions: {
        assignEmail: 'SET_EMAIL';
        assignConfirmationCode: 'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]';
        incrementSendingConfirmationCodeTries: 'RESEND_CONFIRMATION_CODE';
        resetConfirmationCode: 'RESEND_CONFIRMATION_CODE';
    };
    eventsCausingServices: {
        generateConfirmationCode: 'SET_EMAIL';
        sendConfirmationCode:
            | 'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]'
            | 'RESEND_CONFIRMATION_CODE';
        signDocument: 'VALIDATE_CONFIRMATION_CODE';
    };
    eventsCausingGuards: {
        isConfirmationCodeCorrect: 'VALIDATE_CONFIRMATION_CODE';
        hasNotReachedConfirmationCodeSendingLimit: 'RESEND_CONFIRMATION_CODE';
    };
    eventsCausingDelays: {};
    matchesStates:
        | 'pendingSignature'
        | 'pendingSignature.waitingAgreement'
        | 'pendingSignature.waitingEmail'
        | 'pendingSignature.generatingConfirmationCode'
        | 'pendingSignature.sendingConfirmationCode'
        | 'pendingSignature.waitingConfirmationCode'
        | 'pendingSignature.signingDocument'
        | 'pendingSignature.procedureValidated'
        | 'procedureExpired'
        | 'procedureValidated'
        | 'procedureCancelled'
        | {
              pendingSignature?:
                  | 'waitingAgreement'
                  | 'waitingEmail'
                  | 'generatingConfirmationCode'
                  | 'sendingConfirmationCode'
                  | 'waitingConfirmationCode'
                  | 'signingDocument'
                  | 'procedureValidated';
          };
    tags: never;
}
