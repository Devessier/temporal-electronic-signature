// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
    '@@xstate/typegen': true;
    internalEvents: {
        'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]': {
            type: 'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]';
            data: unknown;
            __tip: 'See the XState TS docs to learn how to strongly type this.';
        };
        'xstate.after(120000)#electronicSignatureMachine.pendingSignature': {
            type: 'xstate.after(120000)#electronicSignatureMachine.pendingSignature';
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
        assignConfirmationCode: 'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]';
        assignEmail: 'SET_EMAIL';
        incrementSendingConfirmationCodeTries: 'RESEND_CONFIRMATION_CODE';
        resetConfirmationCode: 'RESEND_CONFIRMATION_CODE';
    };
    eventsCausingServices: {
        generateConfirmationCode: 'SET_EMAIL';
        sendConfirmationCode:
            | 'RESEND_CONFIRMATION_CODE'
            | 'done.invoke.electronicSignatureMachine.pendingSignature.generatingConfirmationCode:invocation[0]';
        signDocument: 'VALIDATE_CONFIRMATION_CODE';
    };
    eventsCausingGuards: {
        hasNotReachedConfirmationCodeSendingLimit: 'RESEND_CONFIRMATION_CODE';
        isConfirmationCodeCorrect: 'VALIDATE_CONFIRMATION_CODE';
    };
    eventsCausingDelays: {};
    matchesStates:
        | 'pendingSignature'
        | 'pendingSignature.generatingConfirmationCode'
        | 'pendingSignature.procedureValidated'
        | 'pendingSignature.sendingConfirmationCode'
        | 'pendingSignature.signingDocument'
        | 'pendingSignature.waitingAgreement'
        | 'pendingSignature.waitingConfirmationCode'
        | 'pendingSignature.waitingEmail'
        | 'procedureCancelled'
        | 'procedureExpired'
        | 'procedureValidated'
        | {
              pendingSignature?:
                  | 'generatingConfirmationCode'
                  | 'procedureValidated'
                  | 'sendingConfirmationCode'
                  | 'signingDocument'
                  | 'waitingAgreement'
                  | 'waitingConfirmationCode'
                  | 'waitingEmail';
          };
    tags: never;
}
