import { test } from '@japa/runner';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { DefaultLogger, LogEntry, Runtime, Worker } from '@temporalio/worker';
import { waitFor } from '@devessier/wait-for';
import { v4 as uuid4 } from 'uuid';
import {
    acceptDocumentSignal,
    cancelProcedureSignal,
    electronicSignature,
    resendConfirmationCodeSignal,
    setEmailForCodeSignal,
    statusQuery,
    validateConfirmationCodeSignal,
} from '../src/workflows';
import type * as Activities from '../src/activities'; // Uses types to ensure our mock signatures match
import { createTestMachine, createTestModel } from '@xstate/test';
import { assign, EventFrom } from 'xstate';
import { spy } from 'sinon';

let testEnv: TestWorkflowEnvironment;

const VALID_CONFIRMATION_CODE = '123456';

const electronicSignatureModelMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5QFkD2EwBsC0AjAhrJAAQAqcALgJYB2UAdAOr5XV3EBmqATsflNzBgAtmBoUAxAEEAxjLAAHCsQioZAV1HiA2gAYAuolALUsVlVQ0jIAB6IArAHZ6ugCyvdARlcBOT059HTwBmewAaEABPRGDHACZ6VzjPOOC3TwAOe3sANmyAX3yItAwcAiIIMkpaBmZzdi5eERZMCQAFblQANyoMYmaqTD1DJBATM2pLazsEf2cU3V0fex8cx3tXUJyI6IQcjIz6YPdjzbi47J9XQuL0LDxCEnJYNlqWV84eYhlLDipuYT4SY0b53egAUUBg2IAAtCMRcEIQURxBIAEpwMSVH40P4AoEWEE-DDDazjcxTUYzRyOVwuHJxILBOJ+da6cJRRBBTz0eyeNz2YIhOKLXRxG4gEr3cpPap0JjvGqfXg4vGA4GgjAQqGYWHwxFiYgoyQYlHY37-dWEzVgbSeEbGUwUqxUhwZZwZC4ZIUHA72DKuHZcjK6eieeKueKOHwXIWOCVSsqPSrPV4K+pQZWg3GWgmWG3tTo9Pqq3Ma4m2gxkp3A6aITLBHKJY6hexLAWubacva6JueVb2OJJIehJIJu5JipVF41dFgfAyGEkBSdeQQdSCfo2BT-PMg0r4SKk0bk2uuhB8uk+YIxjauT3+TxB2YhI7rB8+XQ0q5XcelB5Tqms4AML4DQ8i6iuaiQBulYOmMNaEnWszJAk14rEK4a+F2uzBME9A5DkQq5E4+ydskhRFCANB3PAoyJgBsozvKdQfI0fACEIWgUNWExIeeSTPt4V7rP4vgsn4sTXFRDEyimcpvBmWYDJgvHOshTjPjkvb0OcHiOOyfL+Def7Ssm05pqxSrsaW+LlmCkItHqsAIkiRpiDxJ6IZSoAzL4PgEZ2wTuo2gpxIRwTPtyvLsqsqRxAGHjBKZk5MZZioNF8tlWvmFb0BiC5LuaOZ2daFbuTQEBKpgVDCKwalnr59axIcKwGbS6wGYROFcp4PJtisDLMolYopYx8nMYpbFZRapW5XcDX8U1CCuHygVESFeTMhFz7ZPYvKMj417hTkPieslMkTuNFk1PQADKVBQDQJCqBo3GLT5tiIKk-ouN6XjBcFrgpLtR1HL4zIpP2bLSbc-5yTd8odNB66bmA27-JAH0ustuR0o4N6BEEBkiqdz7JKGNKOAGeFnb4tJjQjQHyqB4FYJgy6rjBgjY8hfXevQVz9isSTXt4jhCUK9BZAynbRiEujMoz5nM1AvPntgPUINg2RHLGGxuNeyxitJhRAA */
    createTestMachine(
        {
            context: { confirmationCodeSendingsCount: 0 },
            tsTypes:
                {} as import('./electronic-signature.spec.typegen').Typegen0,
            schema: {
                context: {} as {
                    confirmationCodeSendingsCount: number;
                },
                events: {} as
                    | { type: 'Accept document' }
                    | { type: 'Provide email' }
                    | { type: 'Resend confirmation code' }
                    | {
                          type: 'Provide confirmation code';
                          confirmationCode: string;
                      }
                    | { type: 'Reached procedure expiration delay' }
                    | { type: 'Cancel procedure' },
            },
            id: 'Model-based Testing',
            initial: 'Waiting for agreement',
            states: {
                'Waiting for agreement': {
                    on: {
                        'Accept document': {
                            target: 'Waiting for email',
                        },
                    },
                },
                'Waiting for email': {
                    on: {
                        'Provide email': {
                            target: 'Waiting for confirmation code',
                        },
                    },
                },
                'Waiting for confirmation code': {
                    description:
                        'An email should have been sent containing a confirmation code.',
                    initial: 'Email has been sent',
                    states: {
                        'Email has been sent': {
                            on: {
                                'Resend confirmation code': [
                                    {
                                        target: 'Reached confirmation code sending limit',
                                        cond: 'has reached confirmation code sending limit',
                                    },
                                    {
                                        actions:
                                            'Increment confirmation code sendings count',
                                    },
                                ],
                            },
                        },
                        'Reached confirmation code sending limit': {},
                    },
                    on: {
                        'Provide confirmation code': {
                            target: 'Signed document',
                            cond: 'is confirmation code valid',
                        },
                    },
                },
                'Signed document': {
                    type: 'final',
                },
                'Procedure expired': {
                    type: 'final',
                },
                'Cancelled procedure': {
                    type: 'final',
                },
            },
            on: {
                'Reached procedure expiration delay': {
                    target: '.Procedure expired',
                },
                'Cancel procedure': {
                    target: '.Cancelled procedure',
                },
            },
        },
        {
            actions: {
                'Increment confirmation code sendings count': assign({
                    confirmationCodeSendingsCount: (context) =>
                        context.confirmationCodeSendingsCount + 1,
                }),
            },
            guards: {
                'has reached confirmation code sending limit': ({
                    confirmationCodeSendingsCount,
                }) => {
                    return confirmationCodeSendingsCount >= 3;
                },
                'is confirmation code valid': (
                    _context,
                    { confirmationCode },
                ) => {
                    return confirmationCode === VALID_CONFIRMATION_CODE;
                },
            },
        },
    );

const electronicSignatureModel = createTestModel(
    electronicSignatureModelMachine,
);

test.group('Electronic signature model-based', (group) => {
    group.setup(async () => {
        // Use console.log instead of console.error to avoid red output
        // Filter INFO log messages for clearer test output
        Runtime.install({
            logger: new DefaultLogger('WARN', (entry: LogEntry) =>
                console.log(`[${entry.level}]`, entry.message),
            ),
        });

        testEnv = await TestWorkflowEnvironment.createTimeSkipping();

        return async () => {
            await testEnv.teardown();
        };
    });

    for (const path of electronicSignatureModel.getPaths({
        eventCases: {
            'Provide confirmation code': [
                {
                    confirmationCode: 'Invalid code',
                },
                {
                    confirmationCode: VALID_CONFIRMATION_CODE,
                },
            ],
        },
    })) {
        test(path.description, async ({ expect }) => {
            try {
                const { client, nativeConnection } = testEnv;

                const sendConfirmationCodeEmailSpy = spy(async () => {});
                const stampDocumentSpy = spy(async () => {});

                const mockActivities: typeof Activities = {
                    generateConfirmationCode: async () => {
                        return VALID_CONFIRMATION_CODE;
                    },
                    sendConfirmationCodeEmail: sendConfirmationCodeEmailSpy,
                    stampDocument: stampDocumentSpy,
                };
                const worker = await Worker.create({
                    connection: nativeConnection,
                    taskQueue: 'test',
                    workflowsPath: require.resolve('../src/workflows'),
                    activities: mockActivities,
                });

                await worker.runUntil(async () => {
                    const handle = await client.workflow.start(
                        electronicSignature,
                        {
                            args: [{ documentId: uuid4() }],
                            workflowId: uuid4(),
                            taskQueue: 'test',
                        },
                    );

                    await path.test({
                        states: {
                            'Cancelled procedure': async () => {
                                await waitFor(async () => {
                                    const status = await handle.query(
                                        statusQuery,
                                    );

                                    expect(status).toBe('CANCELLED');
                                });
                            },
                            'Procedure expired': async () => {
                                await waitFor(async () => {
                                    const status = await handle.query(
                                        statusQuery,
                                    );

                                    expect(status).toBe('EXPIRED');
                                });
                            },
                            'Signed document': async () => {
                                const finalStatus = await handle.result();

                                expect(finalStatus).toBe('VALIDATED');
                            },
                            'Waiting for agreement': async () => {
                                await waitFor(async () => {
                                    const status = await handle.query(
                                        statusQuery,
                                    );

                                    expect(status).toBe(
                                        'PENDING.WAITING_AGREEMENT',
                                    );
                                });
                            },
                            'Waiting for confirmation code': async () => {
                                await waitFor(async () => {
                                    const status = await handle.query(
                                        statusQuery,
                                    );

                                    expect(status).toBe(
                                        'PENDING.WAITING_CONFIRMATION_CODE',
                                    );
                                });
                            },
                            'Waiting for confirmation code.Email has been sent':
                                async () => {
                                    await waitFor(() => {
                                        expect(
                                            sendConfirmationCodeEmailSpy.called,
                                        ).toBe(true);
                                    });
                                },
                            'Waiting for confirmation code.Reached confirmation code sending limit':
                                async () => {
                                    await waitFor(() => {
                                        expect(
                                            sendConfirmationCodeEmailSpy.callCount,
                                        ).toBe(4);
                                    });
                                },
                            'Waiting for email': async () => {
                                await waitFor(async () => {
                                    const status = await handle.query(
                                        statusQuery,
                                    );

                                    expect(status).toBe(
                                        'PENDING.WAITING_EMAIL',
                                    );
                                });
                            },
                        },
                        events: {
                            'Accept document': async () => {
                                await handle.signal(acceptDocumentSignal);
                            },
                            'Provide email': async () => {
                                await handle.signal(setEmailForCodeSignal, {
                                    email: 'email@google.com',
                                });
                            },
                            'Provide confirmation code': async ({ event }) => {
                                const { confirmationCode } = event as EventFrom<
                                    typeof electronicSignatureModelMachine,
                                    'Provide confirmation code'
                                >;

                                await handle.signal(
                                    validateConfirmationCodeSignal,
                                    { confirmationCode },
                                );
                            },
                            'Cancel procedure': async () => {
                                await handle.signal(cancelProcedureSignal);
                            },
                            'Resend confirmation code': async () => {
                                await handle.signal(
                                    resendConfirmationCodeSignal,
                                );
                            },
                            'Reached procedure expiration delay': async () => {
                                await testEnv.sleep('2 minutes');
                            },
                        },
                    });
                });
            } catch (err) {
                console.error(err);

                throw err;
            }
        });
    }
});
