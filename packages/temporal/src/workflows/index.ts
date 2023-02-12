import {
    proxyActivities,
    defineQuery,
    defineSignal,
    setHandler,
} from '@temporalio/workflow';
import { createMachine, assign, interpret, StateFrom } from 'xstate';
import type * as activities from '../activities';
import { ElectronicSignatureProcedureStatus } from '../types';

const { generateConfirmationCode, sendConfirmationCodeEmail, stampDocument } =
    proxyActivities<typeof activities>({
        startToCloseTimeout: '1 minute',
    });

/**
 * The XState machine that powers the workflow.
 *
 * It uses [Typegen](https://xstate.js.org/docs/guides/typescript.html#typegen) to
 * improve TypeScript support. Thanks to Typegen, we know which events will cause
 * a service/action/guard/delay to get executed, and what will be the value of `event`
 * parameter for them.
 *
 * I also designed the machine by using Stately Visual Editor. Go check [Stately](https://stately.ai/) website!
 */
const electronicSignatureMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5RgDZgMYBcBOB7AdgJboDKhU+AhpgK7ZgCyl6AFofmAHQAOY+E7KGQrU6YAMQQCXWJmpdUGHAWLCqtek1bsuvfoLWj6AbQAMAXUShuuWIUyECVkAA9EAJgCsngGycfABwAjJ5BAJymQQGmpgEANCAAnh4A7AGc7tHh7gDMACzuKSk5PgC+pQmKWHhEpOTqYlpsHDx8AvhC9UYSAMIAggByPQCiADIA+gAKAEoA8iMAIgCq08NmlkggNnYOTptuCF6m7pymYSlhgQFhOZ7BOQnJCDkBnqehBTmmty85YeWVNDVFR1EQaRjMZq6NoGLrg8QuWTyTiUABmmDA2AAFEF3DEYgBKcRVZS1Qzgpo6Vr6DrksTrZzbeyOfDOA5eTwncJ5HJ4lKFTxhIIPJKIIIpUycUIvTwpPKmHy3RWeAHgIGk1RwxqQql6dqdMFiTgAd0ozI6fSg9DAAFs+JhxH0eiNJgAVcYLeZLBjDAauhmbJm7Vn7Dyy04pTk+Yr8nJBPLRx5iuWnXE8vKvHyefJlCpqpQ1TWGzQ6lp62HFrim81QYY2s0ocQkYbu4YMPoASVGAestmZe1ABx84U4eRSPncWZuuN+SYQIUlYWnsvHQVMeUueVVJMLoIaJe0ZZhtK19E4MA42Gogh6BFRhGw9eDt4gEikLXYADdcABrBTq3c6QPKFqX1ICuAvTFrw6W98HvR9rwIF8wAQL9cHQRD8HWHstj7YM2TFUxI04HIigCPIN0idcxznEITg3HweTOAIAglCIAm3ACQXAykjxpA19xkY8oFg+CnxZZDJGkTg0L-Tgd2408IUPaF+PAzhYGE0SH3EpDcFfVD8G-DDg2wixGTwlkCIQYI8k4AI-nXAJ3HOXlLjnTJJXCccKKOFzvk4gtFMrXjVLApSTTNBwYLvHTMMkgA1PpRg7BY+ldYZxh6WYBgAMQ7aZ21dDscqy2YFjWczA0sgdXEIlNMjXIIfDCTweTxPI505E4hWuTMfEiMI8hVPMFLJJTQtAitBMimttIQ599IkVZmwGBYyrygqipKgYyoqnCgys0N5zOMIMmzdwQl5PI12uOcviCDJikuBVmvcdxhq3UauPGkLSzC6bug0+pBAWdCaDtfAHXfLhZP-ILfsEybyxPStgYoUHwchzBDOMzCzI2XsdiOwcxValJTincc8SG1i5wKSUiMKG4Xg+nlczzfAlvgTYxqLJH-os4naoOABaD653FnJOCXMJrlCc4fCzCiRsBBH+e6ZHhPAoX+xDUnDk60UEEVUdLkVXFghay7AuBRHNf+qbUZm6toqgS1rWx3X8OO-laJTTwiKFTIhvlY5VfzO2NYpR2UYEoHXcEOsG29km6oQMc7OCOXLrSRVWp8f27MDi5LdDmIcltjU9wdlSnfj8Fzz4KC3fm3T8GQ1ORcQcd0ity6Shp9raNCVNmtIy6XNa+Mq8AibY+1iLNP4tv4qWrv9fT5ryJluNLlyQUZ0L433ulyJBQnF4XrudxZ+CgW67j9TE5iuC4sW18N+s5zpZCeNMhlNcSI9Mzj+BuENcIsQEwsTvvbGOj9F5ozsBjDoYN0AQ3tF-Y64pYhSglM5AI0YogDU8Pdc4EZwjXAonKNIKRYHR21AgtSEVuB4HQJAMQCVKAoEIBAeQEAsEG1zo9G6oRhwZgTIxemI5eTrneniQI7NcxqyjjXeBIFWHoQ4fQYYLhuAPkgII9OhQUiPRITkUiLFyLilotGTgkZs4SnlHKUiX0VHVx4rHNh2iwBcJ4XwjEAjqrC03uyccbx4wJlxIUQex8ngCilB9Ri5FcikVMZXb66s1GMI0d4iAYgeiUHwOwlAaAglEz1tZQoE5-BpBKK1EoEoUj3QcvYpcTMvicmcuUcoQA */
    createMachine(
        {
            id: 'electronicSignatureMachine',

            tsTypes: {} as import('./index.typegen').Typegen0,

            schema: {
                context: {} as {
                    documentId: string;
                    email: string | undefined;
                    sendingConfirmationCodeTries: number;
                    confirmationCode: string | undefined;
                },
                events: {} as
                    | {
                          type: 'PROCEDURE_TIMEOUT';
                      }
                    | {
                          type: 'ACCEPT_DOCUMENT';
                      }
                    | {
                          type: 'SET_EMAIL';
                          email: string;
                      }
                    | {
                          type: 'VALIDATE_CONFIRMATION_CODE';
                          confirmationCode: string;
                      }
                    | {
                          type: 'RESEND_CONFIRMATION_CODE';
                      }
                    | {
                          type: 'CANCEL_PROCEDURE';
                      },
                services: {} as {
                    generateConfirmationCode: {
                        data: string;
                    };
                    sendConfirmationCode: {
                        data: void;
                    };
                    signDocument: {
                        data: void;
                    };
                },
            },

            initial: 'pendingSignature',

            context: {
                documentId: '', // Will be redefined when starting the machine inside the workflow.
                sendingConfirmationCodeTries: 0,
                email: undefined,
                confirmationCode: undefined,
            },

            states: {
                pendingSignature: {
                    after: {
                        120_000: {
                            target: 'procedureExpired',
                        },
                    },

                    initial: 'waitingAgreement',

                    states: {
                        waitingAgreement: {
                            on: {
                                ACCEPT_DOCUMENT: {
                                    target: 'waitingEmail',
                                },
                            },
                        },

                        waitingEmail: {
                            on: {
                                SET_EMAIL: {
                                    target: 'generatingConfirmationCode',

                                    actions: 'assignEmail',
                                },
                            },
                        },

                        generatingConfirmationCode: {
                            invoke: {
                                src: 'generateConfirmationCode',

                                onDone: {
                                    target: 'sendingConfirmationCode',
                                    actions: 'assignConfirmationCode',
                                },
                            },
                        },

                        sendingConfirmationCode: {
                            invoke: {
                                src: 'sendConfirmationCode',

                                onDone: {
                                    target: 'waitingConfirmationCode',
                                },
                            },
                        },

                        waitingConfirmationCode: {
                            on: {
                                VALIDATE_CONFIRMATION_CODE: {
                                    cond: 'isConfirmationCodeCorrect',

                                    target: 'signingDocument',
                                },

                                RESEND_CONFIRMATION_CODE: {
                                    cond: 'hasNotReachedConfirmationCodeSendingLimit',

                                    target: 'sendingConfirmationCode',

                                    actions: [
                                        'incrementSendingConfirmationCodeTries',
                                        'resetConfirmationCode',
                                    ],
                                },
                            },
                        },

                        signingDocument: {
                            invoke: {
                                src: 'signDocument',

                                onDone: {
                                    target: 'procedureValidated',
                                },
                            },
                        },

                        procedureValidated: {
                            type: 'final',
                        },
                    },

                    on: {
                        CANCEL_PROCEDURE: {
                            target: 'procedureCancelled',
                        },
                    },

                    onDone: {
                        target: 'procedureValidated',
                    },
                },

                procedureExpired: {
                    type: 'final',
                },

                procedureValidated: {
                    type: 'final',
                },

                procedureCancelled: {
                    type: 'final',
                },
            },

            predictableActionArguments: true,

            preserveActionOrder: true,
        },
        {
            services: {
                generateConfirmationCode: (_context, _event) => {
                    return generateConfirmationCode();
                },

                sendConfirmationCode: async (
                    { confirmationCode, email },
                    _event,
                ) => {
                    try {
                        if (
                            confirmationCode === undefined ||
                            email === undefined
                        ) {
                            throw new Error(
                                'Confirmation code and email must be defined to send the confirmation code by email',
                            );
                        }

                        await sendConfirmationCodeEmail({
                            confirmationCode,
                            email,
                        });
                    } catch (err) {
                        console.error(err);
                    }
                },

                signDocument: async (context, _event) => {
                    try {
                        await stampDocument(context.documentId);
                    } catch (err) {
                        console.error(err);
                    }
                },
            },
            actions: {
                incrementSendingConfirmationCodeTries: assign({
                    sendingConfirmationCodeTries: (
                        { sendingConfirmationCodeTries },
                        _event,
                    ) => sendingConfirmationCodeTries + 1,
                }),

                assignEmail: assign({
                    email: (_context, event) => event.email,
                }),

                resetConfirmationCode: assign({
                    confirmationCode: (_context, _event) => undefined,
                }),

                assignConfirmationCode: assign({
                    confirmationCode: (_context, event) => event.data,
                }),
            },
            guards: {
                hasNotReachedConfirmationCodeSendingLimit: (
                    { sendingConfirmationCodeTries },
                    _event,
                ) => sendingConfirmationCodeTries < 3,

                isConfirmationCodeCorrect: ({ confirmationCode }, event) =>
                    confirmationCode === event.confirmationCode,
            },
        },
    );

interface ElectronicSignatureWorkflowArgs {
    documentId: string;
}

export const statusQuery =
    defineQuery<ElectronicSignatureProcedureStatus>('status');

export const acceptDocumentSignal = defineSignal('acceptDocument');
export const setEmailForCodeSignal =
    defineSignal<[{ email: string }]>('setEmailForCode');
export const validateConfirmationCodeSignal = defineSignal<
    [{ confirmationCode: string }]
>('validateConfirmationCode');
export const resendConfirmationCodeSignal = defineSignal(
    'resendConfirmationCode',
);
export const cancelProcedureSignal = defineSignal('cancelProcedure');

export async function electronicSignature({
    documentId,
}: ElectronicSignatureWorkflowArgs): Promise<ElectronicSignatureProcedureStatus> {
    /**
     * Create a custom machine with the documentId of the procedure.
     */
    const machine = electronicSignatureMachine.withContext({
        ...electronicSignatureMachine.context,
        documentId,
    });
    /**
     * State holds the current state of the state machine.
     *
     * By default it is the `initialState` of the machine.
     */
    let state = machine.initialState;
    /**
     * State machines created with `createMachine` do nothing by default.
     * They are *representations* and you need an engine to make them become real.
     * This is what `interpret` does.
     * It puts the state machine in an engine that reads the configuration and execute all steps.
     * The alive representation of the state machine is called a `service`.
     */
    const service = interpret(machine);
    /**
     * For each transition, we keep track of the new state.
     */
    service.onTransition((updatedState) => {
        state = updatedState;
    });
    /**
     * Now that the service is configured, put the power on.
     */
    service.start();
    /**
     * Send is a function that is used to send events to the state machine.
     * It is typesafe.
     */
    const send = service.send.bind(service);

    /**
     * Queries derive data from the current state of the state machine.
     */
    setHandler(statusQuery, () => {
        return formatStateMachineState(state);
    });

    /**
     * Transform Temporal signals into events sent to the state machine.
     * When using XState, logic should never happen where events are sent.
     * Logic is handled inside the state machine.
     */
    setHandler(acceptDocumentSignal, () => {
        send({
            type: 'ACCEPT_DOCUMENT',
        });
    });
    setHandler(setEmailForCodeSignal, ({ email }) => {
        send({
            type: 'SET_EMAIL',
            email,
        });
    });
    setHandler(validateConfirmationCodeSignal, ({ confirmationCode }) => {
        send({
            type: 'VALIDATE_CONFIRMATION_CODE',
            confirmationCode,
        });
    });
    setHandler(resendConfirmationCodeSignal, () => {
        send({
            type: 'RESEND_CONFIRMATION_CODE',
        });
    });
    setHandler(cancelProcedureSignal, () => {
        send({
            type: 'CANCEL_PROCEDURE',
        });
    });

    /**
     * Wait for the machine to reach a `final state`.
     * In such a state, a state machine can no longer receive events.
     * XState allows us to run a callback when a state machine reaches its final state
     * by using `onDone` method.
     * In our case, we reach the final state of the state machine
     * when the signature procedure ended.
     */
    await new Promise((resolve) => {
        service.onDone(resolve);
    });

    /**
     * Return the final state of the machine.
     */
    return formatStateMachineState(state);
}

/**
 * `formatStateMachineState` transforms the current state of the state machine
 * into an universal identifier.
 * We do not want to depend on states naming outside of the state machine.
 *
 * If the state is unknown, we throw an error.
 */
function formatStateMachineState(
    state: StateFrom<typeof electronicSignatureMachine>,
): ElectronicSignatureProcedureStatus {
    if (state.matches('pendingSignature.waitingAgreement')) {
        return 'PENDING.WAITING_AGREEMENT';
    }
    if (state.matches('pendingSignature.waitingEmail')) {
        return 'PENDING.WAITING_EMAIL';
    }
    if (state.matches('pendingSignature.generatingConfirmationCode')) {
        return 'PENDING.GENERATING_CONFIRMATION_CODE';
    }
    if (state.matches('pendingSignature.sendingConfirmationCode')) {
        return 'PENDING.SENDING_CONFIRMATION_CODE';
    }
    if (state.matches('pendingSignature.waitingConfirmationCode')) {
        return 'PENDING.WAITING_CONFIRMATION_CODE';
    }
    if (state.matches('pendingSignature.signingDocument')) {
        return 'PENDING.SIGNING_DOCUMENT';
    }
    if (state.matches('procedureExpired')) {
        return 'EXPIRED';
    }
    if (state.matches('procedureValidated')) {
        return 'VALIDATED';
    }
    if (state.matches('procedureCancelled')) {
        return 'CANCELLED';
    }

    throw new Error(
        'Reached unreachable state; a state has probably been added or renamed from the state machine and needs to be normalized in formatStateMachineState function',
    );
}
