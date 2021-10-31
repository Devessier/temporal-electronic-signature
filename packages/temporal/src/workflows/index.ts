import {
    createActivityHandle,
    sleep,
    defineQuery,
    defineSignal,
    setListener,
    CancellationScope,
    isCancellation,
} from '@temporalio/workflow';
import { createMachine, assign, interpret, StateFrom } from 'xstate';
import type * as activities from '../activities';
import { ElectronicSignatureProcedureStatus } from '../types';
import { assertEventType } from '../utils/machine/events';

const { generateConfirmationCode, sendConfirmationCodeEmail, stampDocument } =
    createActivityHandle<typeof activities>({
        startToCloseTimeout: '1 minute',
    });

interface ElectronicSignatureMachineContext {
    email: string | undefined;
    sendingConfirmationCodeTries: number;
    confirmationCode: string | undefined;
}

type ElectronicSignatureMachineEvents =
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
          type: 'SENT_CONFIRMATION_CODE';
      }
    | {
          type: 'VALIDATE_CONFIRMATION_CODE';
          confirmationCode: string;
      }
    | {
          type: 'RESEND_CONFIRMATION_CODE';
      }
    | {
          type: 'SIGNED_DOCUMENT';
      }
    | {
          type: 'CANCEL_PROCEDURE';
      };

interface CreateElectronicSignatureMachineArgs {
    documentId: string;
}

function createElectronicSignatureMachine({
    documentId,
}: CreateElectronicSignatureMachineArgs) {
    return createMachine<
        ElectronicSignatureMachineContext,
        ElectronicSignatureMachineEvents
    >({
        id: 'electronicSignatureMachine',

        initial: 'pendingSignature',

        context: {
            sendingConfirmationCodeTries: 0,
            email: undefined,
            confirmationCode: undefined,
        },

        states: {
            pendingSignature: {
                after: {
                    60_000: {
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

                                actions: assign({
                                    confirmationCode: (_context, { data }) =>
                                        data,
                                }),
                            },
                        },
                    },

                    sendingConfirmationCode: {
                        invoke: {
                            src: 'sendConfirmationCode',
                        },

                        on: {
                            SENT_CONFIRMATION_CODE: {
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
                        },

                        on: {
                            SIGNED_DOCUMENT: {
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
    }).withConfig({
        services: {
            generateConfirmationCode: async (_context, _event) => {
                return await generateConfirmationCode();
            },

            sendConfirmationCode:
                ({ confirmationCode, email }, _event) =>
                async (sendBack) => {
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

                        sendBack({
                            type: 'SENT_CONFIRMATION_CODE',
                        });
                    } catch (err) {
                        console.error(err);
                    }
                },

            signDocument: (_context, _event) => async (sendBack) => {
                try {
                    await stampDocument(documentId);

                    sendBack({
                        type: 'SIGNED_DOCUMENT',
                    });
                } catch (err) {
                    console.error(err);
                }
            },
        },

        guards: {
            hasNotReachedConfirmationCodeSendingLimit: (
                { sendingConfirmationCodeTries },
                _event,
            ) => sendingConfirmationCodeTries < 3,

            isConfirmationCodeCorrect: ({ confirmationCode }, event) => {
                assertEventType(event, 'VALIDATE_CONFIRMATION_CODE');

                return confirmationCode === event.confirmationCode;
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
                email: (_context, event) => {
                    assertEventType(event, 'SET_EMAIL');

                    return event.email;
                },
            }),

            resetConfirmationCode: assign({
                confirmationCode: (_context, _event) => undefined,
            }),
        },
    });
}

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
    const machine = createElectronicSignatureMachine({
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
    const service = interpret(machine, {
        /**
         * Define a custom implementation of the clock used by XState to handle
         * `delayed transitions`, that is transitions that occur after some time.
         * By default it uses `setTimeout` and `clearTimeout`.
         * Here we want to ditch the default implementation and use Temporal `sleep` function.
         * We run `sleep` in a cancellation scope returned by `setTimeout`
         * so that in `clearTimeout` the timer can actually be cancelled.
         */
        clock: {
            setTimeout(fn, timeout) {
                const scope = new CancellationScope();

                scope
                    .run(() => {
                        return sleep(timeout).then(fn);
                    })
                    .catch((err) => {
                        if (isCancellation(err)) {
                            return;
                        }

                        throw err;
                    });

                return scope;
            },

            clearTimeout(scope: CancellationScope) {
                scope.cancel();
            },
        },
    });
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
    setListener(statusQuery, () => {
        return formatStateMachineState(state);
    });

    /**
     * Transform Temporal signals into events sent to the state machine.
     * When using XState, logic should never happen where events are sent.
     * Logic is handled inside the state machine.
     */
    setListener(acceptDocumentSignal, () => {
        send({
            type: 'ACCEPT_DOCUMENT',
        });
    });
    setListener(setEmailForCodeSignal, ({ email }) => {
        send({
            type: 'SET_EMAIL',
            email,
        });
    });
    setListener(validateConfirmationCodeSignal, ({ confirmationCode }) => {
        send({
            type: 'VALIDATE_CONFIRMATION_CODE',
            confirmationCode,
        });
    });
    setListener(resendConfirmationCodeSignal, () => {
        send({
            type: 'RESEND_CONFIRMATION_CODE',
        });
    });
    setListener(cancelProcedureSignal, () => {
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
    state: StateFrom<typeof createElectronicSignatureMachine>,
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
