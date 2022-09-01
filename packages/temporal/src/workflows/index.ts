import {
    proxyActivities,
    defineQuery,
    defineSignal,
    setHandler,
} from '@temporalio/workflow';
import { createMachine, assign, interpret, StateFrom } from 'xstate';
import type * as activities from '../activities';
import { ElectronicSignatureProcedureStatus } from '../types';
import { assertEventType } from '../utils/machine/events';

const { generateConfirmationCode, sendConfirmationCodeEmail, stampDocument } =
    proxyActivities<typeof activities>({
        startToCloseTimeout: '1 minute',
    });

const electronicSignatureMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5RgDZgMYBcBOB7AdgJboDKhU+AhpgK7ZgCyl6AFofmAHQAOY+E7KGQrU6XAO6VCmQQEEo9MAFs+mAMSyAwpoCiABQAqAfQAiAeU0BVBjoByBxKG65Y0wgUcgAHogBMAVgAWTgAGf38ARl9A-wBmCNiAdgA2cIAaEABPRAiATgAOTgLfENyQ5MTc5MDk31iAX3qM1AwcAmJhKlp6JlZ2Ll5+QU7Rek5JN3woHSUpFDUSHWMdBlkASQAZT2dXGQ8kb0RkkNjOWN9k1OTcxMDEoP8M7IQIys5A-MSQk8DvmryGk1wGgsHgiKRyF0xL02BweHwBFMRt0uDAONhqIJNAQAGaEbCzPb4bEQMBqCAELjsABuuAA1lwWqD2hCRCiYf14UMkZDRqi+GAMTIptj8HiCZiCCSwAgabh0JL8ABtEIAXW2Ljc+1APheITeqQKt18EX1+oiTxybw+Xx+f2SAMazRBbXByOhzFhAwRw15KM4sB9Itx+MJ7mJuFJCzsxk0ZlsADE1gAlVYGNbxoxxkw6DW7cOeXVRe6cZLnGKJaJ5QK+S0IC7Jd7HfIRQKxWIhfLhCJO4GtMEdP0evpwwaIoRDsYTYVQUXisNSyNkgBqsg2axMsgMOiz8aTqa3Gdsu5zea1+ELOX1uVL-iNNdNX0SFqyiH83zOXdSiR-MXy+UCXsmVdQc2WHL0uXHd0pykGc51DRVpTUZMdEWWwTF3RMUzTI8T1zA4dnPS89QNO9PgfM1nzreJgkCOiYjNXxPhufwgJdAdWShHpPU5MdfTAsZXAoQQTHlGgVHwdQSDWABxWwdAw8wrBsewzyJYiIi7U5yleWI4kuTSTTrOJ-DOSs9JrOjyjY-sWWgxgeNHIMJwEskKThWBMGoRl2LsycHJHb1uRcriwDUgsDl1OoIlM3IkgA3xclyaIAkCaiYlLe5YnyTtzgiKJfBs5k3X8jknOC+y1E0WRbF0DYjD0ZMLAUywUPC7VDnreJYvimskpSoI6w+XxOBSeJonyVJ8iYsIipAzi+TKoKoP8tQvE87zOEoHFMEFAAKKJvm+ABKNRgI4+ylsg-jQvai9Ir8bqil6xLkprQbX3rTtOH8T4ywqApYiqc5GiBfAl3gA5zr81yrr4nlXPGWC5AUMBlFUO7iMrOsAXeRIcuuFt3yCfI5ou0rHOWm6+SRyZplmQgUExh6EH+M5cjyRJst+EIElrT7cbuHK9NbMIClbMmYdCuHnPszg0UFTFgzFBCiWlZmdUQW5G00-HygA9sOeSHGKiKfJYgfMoEi7OjJZK2HKeuhHQoDZz4IlNWlw1zqYo+ThfGfCpfxOXmX2ePIRsrSaWxy6bqmSO3QOlx34ZCmnpyxEMPfDdWCM1dSWYAkJOBbYpzeuFIYuoktAgjmLNJbDs9MThb2RT2X-IDSERLEiTMG9ot-BSUta7KACObbRJjJCYIkliZIbe-JLAWdWz7eTwKnbT-1uDwdBIDEZdKBQQgIG8iAB78MJElCE0O2fcXO2MxKzkuGpajbZKuZby724q-zL6s3yHWKooRTQ1luEkPIuQgg-wppvXe8oD70B0F4bg+JICAImoUGIHZ8pD31AHR4n0SgjV+q8Fs1Rfz5FyHAh2CC97ILAEfE+Z9doXzzvmDqUU2zF0CMlC4iVsoG2okDUs1x-ABAXq2KhK8+zFSTotFOjCIBiE0JQfA+8UBoA4U4fOEVNb1kkTeZeuVaj5WmmlT6dxGz3ErCEE0HM6ifDoRvL0WCrHPGiKEcsqQHH-nxiTUG9QgA */
    createMachine({
        context: {
            sendingConfirmationCodeTries: 0,
            email: undefined,
            confirmationCode: undefined,
        },
        tsTypes: {} as import('./index.typegen').Typegen0,
        schema: {
            context: {} as {
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
                  },
            services: {} as {
                generateConfirmationCode: {
                    data: string;
                };
            },
        },
        id: 'electronicSignatureMachine',
        initial: 'pendingSignature',
        states: {
            pendingSignature: {
                initial: 'waitingAgreement',
                after: {
                    '120000': {
                        target: 'procedureExpired',
                    },
                },
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
                                actions: 'assignEmail',
                                target: 'generatingConfirmationCode',
                            },
                        },
                    },
                    generatingConfirmationCode: {
                        invoke: {
                            src: 'generateConfirmationCode',
                            onDone: [
                                {
                                    actions: 'assignConfirmationCode',
                                    target: 'sendingConfirmationCode',
                                },
                            ],
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
                                actions: [
                                    'incrementSendingConfirmationCodeTries',
                                    'resetConfirmationCode',
                                ],
                                cond: 'hasNotReachedConfirmationCodeSendingLimit',
                                target: 'sendingConfirmationCode',
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
    });

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
    const machine = electronicSignatureMachine.withConfig({
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

            assignConfirmationCode: assign({
                confirmationCode: (_context, { data }) => data,
            }),
        },
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
     * `formatStateMachineState` transforms the current state of the state machine
     * into an universal identifier.
     * We do not want to depend on states naming outside of the state machine.
     *
     * If the state is unknown, we throw an error.
     */
    function formatStateMachineState(
        state: StateFrom<typeof machine>,
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
