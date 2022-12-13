// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
    '@@xstate/typegen': true;
    internalEvents: {
        'xstate.init': { type: 'xstate.init' };
    };
    invokeSrcNameMap: {};
    missingImplementations: {
        actions: never;
        services: never;
        guards: never;
        delays: never;
    };
    eventsCausingActions: {
        'Increment confirmation code sendings count': 'Resend confirmation code';
    };
    eventsCausingServices: {};
    eventsCausingGuards: {
        'has reached confirmation code sending limit': 'Resend confirmation code';
        'is confirmation code valid': 'Provide confirmation code';
    };
    eventsCausingDelays: {};
    matchesStates:
        | 'Cancelled procedure'
        | 'Procedure expired'
        | 'Signed document'
        | 'Waiting for agreement'
        | 'Waiting for confirmation code'
        | 'Waiting for confirmation code.Email has been sent'
        | 'Waiting for confirmation code.Reached confirmation code sending limit'
        | 'Waiting for email'
        | {
              'Waiting for confirmation code'?:
                  | 'Email has been sent'
                  | 'Reached confirmation code sending limit';
          };
    tags: never;
}
