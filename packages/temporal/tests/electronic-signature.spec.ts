import { test } from '@japa/runner';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { v4 as uuid4 } from 'uuid';
import { electronicSignature, statusQuery } from '../src/workflows';
import type * as Activities from '../src/activities'; // Uses types to ensure our mock signatures match
import { createTestMachine, createTestModel } from '@xstate/test';
import { assign } from 'xstate';

let testEnv: TestWorkflowEnvironment;

const electronicSignatureModelMachine =
    /** @xstate-layout N4IgpgJg5mDOIC5QFkD2EwBsC0AjAhrJAAQAqcALgJYB2UAdAOr5XV3EBmqATsflNzBgAtmBoUAxAEEAxjLAAHCsQioZAV1HjEoBalisqqGjpAAPRAEZLAJnoB2AKwAOGwBZLATgDMNgAzeAGyO3gA0IACeiDbenvTebk72zp5ujoF+ls4AvtnhaBg4BEQQZJS0DMyG7Fy8IiyYEgAK3KgAblQYxPVUmKZ6BtTGphYIvnGBboGWIT7efs72lmGRiLHe9J7pfp7Olhn2vjb2ufnoWHiEJOSwbJUsd5w8xDLGHFTcwvhDNC-n9ABRL69YgAC0IxFwQl+RHEEgASnAxKVXjR3p9vkZfq8MP19IZhkhzIgPHFvI4solHI57NMQuEoggln56As-H43L4adYUqcQAULsVruU6EwHhUnrxUeivj8-hhmq0Ol1pR9ZVj5WA8YMsSMrDE7Klpp4fJZ7DFnCtGRlLPFqcEliaMsc+QKildSjc7giwPgZKCSApWvIIOpBN0zAoPpjjCosPhGbp8T89UzgvQbDFgvM9ilLAzEJ5AvQ3HtvEF9s5nB43K7zu6SmVbhUJABhfA0eSYYhBtSQMNaokDAkmImjZY2YtbQLOPzHRyedyOGwFhBFktltK7SxuDxz3J5EA0c7wIluy6Nr0VMXVKCSvgCIRaCjakepyxzhw2BfslLzQKpM4q7LI4DgUjEC4AV4Cy1oe55Cp6Ir3Le949H0Q7JrqY5WDM9C2I4bgxHOyy7jSq7lraRZUYsNgzI4AR1oUF7Cs2opVI8tR-Giaoxti-xAg0YIQlCYjELCL4YTqhKgKMmagX4BwLlSaRuJ49irrSoEhDM3jOBks4JIxgoek2dw3hxzyqhico4mA9CIn6AYom8PE2ecYnIhKmBUMIrCvim2EIM41J4fMO4ZBy9iZOpqxplp3g6XpbKGXB9bMYhrHIRZUoudZGq2f5WEydEmSsopqROCpamrvRoFmua5I2LsUyBN4JypUxCGmdeADKVBQDQJCqBoz6FdJxIIDpxaToE0y7rmhGOKurUsr4hH+HpNJBI4RkNixZktH2obhmAkYfJAY2jsVQV+PYmwKTOBFpC4iTAfYbj0FWOwLQRi4crt6XdaK7adlgmCBsG-aCJd75NaBam7mpvi2Eab0fV927Vr9-iwWcnUmVedAw4FyRfj+Cw+ApgHAXY9GBPYyQzAptELDkB5AA */
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
                                        cond: 'has reached confirmation code sending limit',
                                        target: 'Reached confirmation code sending limit',
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
                            cond: 'is confirmation code valid',
                            target: 'Signed document',
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
                    return confirmationCode === 'LOL';
                },
            },
        },
    );

const electronicSignatureModel = createTestModel(
    electronicSignatureModelMachine,
);

test.group('Electronic signature model-based', (group) => {
    group.setup(async () => {
        testEnv = await TestWorkflowEnvironment.create();

        return async () => {
            await testEnv.teardown();
        };
    });

    // for (const path of electronicSignatureModel.getSimplePathsTo(
    //     (state) => state.done === true,
    // )) {
    for (const path of electronicSignatureModel.getPaths({
        eventCases: {
            'Provide confirmation code': [
                {
                    confirmationCode: 'Invalid code',
                },
                {
                    confirmationCode: 'LOL',
                },
            ],
        },
    })) {
        test(path.description, async () => {
            await path.test({
                states: {},
                events: {},
            });
        });
    }
});

// test.group('Electronic signature', (group) => {
//     group.setup(async () => {
//         testEnv = await TestWorkflowEnvironment.create();

//         return async () => {
//             await testEnv.teardown();
//         };
//     });

//     test('Cancels procedure after 2 minutes', async ({ expect }) => {
//         const { workflowClient, nativeConnection } = testEnv;

//         // Implement only the relevant activities for this workflow
//         const mockActivities: Partial<typeof Activities> = {
//             generateConfirmationCode: async () => '123456',
//             sendConfirmationCodeEmail: async () => {},
//             stampDocument: async () => {},
//         };
//         const worker = await Worker.create({
//             connection: nativeConnection,
//             taskQueue: 'test',
//             workflowsPath: require.resolve('../src/workflows'),
//             activities: mockActivities,
//         });

//         await worker.runUntil(async () => {
//             const result = await workflowClient.execute(electronicSignature, {
//                 args: [{ documentId: uuid4() }],
//                 workflowId: uuid4(),
//                 taskQueue: 'test',
//             });

//             expect(result).toEqual('EXPIRED');
//         });
//     });

//     test('Cancels procedure after 2 minutes manual', async ({ expect }) => {
//         const { workflowClient, nativeConnection } = testEnv;

//         // Implement only the relevant activities for this workflow
//         const mockActivities: Partial<typeof Activities> = {
//             generateConfirmationCode: async () => '123456',
//             sendConfirmationCodeEmail: async () => {},
//             stampDocument: async () => {},
//         };
//         const worker = await Worker.create({
//             connection: nativeConnection,
//             taskQueue: 'test',
//             workflowsPath: require.resolve('../src/workflows'),
//             activities: mockActivities,
//         });

//         await worker.runUntil(async () => {
//             const handle = await workflowClient.start(electronicSignature, {
//                 args: [{ documentId: uuid4() }],
//                 workflowId: uuid4(),
//                 taskQueue: 'test',
//             });

//             const status = await handle.query(statusQuery);
//             expect(status).toBe('PENDING.WAITING_AGREEMENT');

//             await testEnv.sleep('2 minutes');

//             const statusAfterTimeout = await handle.query(statusQuery);
//             expect(statusAfterTimeout).toBe('EXPIRED');

//             const result = await handle.result();
//             expect(result).toBe('EXPIRED');
//         });
//     });
// });
