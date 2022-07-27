import { test } from '@japa/runner';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { v4 as uuid4 } from 'uuid';
import { electronicSignature, statusQuery } from '../src/workflows';
import type * as Activities from '../src/activities'; // Uses types to ensure our mock signatures match

let testEnv: TestWorkflowEnvironment;

test.group('Electronic signature', (group) => {
    group.setup(async () => {
        testEnv = await TestWorkflowEnvironment.create();

        return async () => {
            await testEnv.teardown();
        };
    });

    test('Cancels procedure after 2 minutes', async ({ expect }) => {
        const { workflowClient, nativeConnection } = testEnv;

        // Implement only the relevant activities for this workflow
        const mockActivities: Partial<typeof Activities> = {
            generateConfirmationCode: async () => '123456',
            sendConfirmationCodeEmail: async () => {},
            stampDocument: async () => {},
        };
        const worker = await Worker.create({
            connection: nativeConnection,
            taskQueue: 'test',
            workflowsPath: require.resolve('../src/workflows'),
            activities: mockActivities,
        });

        await worker.runUntil(async () => {
            const result = await workflowClient.execute(electronicSignature, {
                args: [{ documentId: uuid4() }],
                workflowId: uuid4(),
                taskQueue: 'test',
            });

            expect(result).toEqual('EXPIRED');
        });
    });

    test('Cancels procedure after 2 minutes manual', async ({ expect }) => {
        const { workflowClient, nativeConnection } = testEnv;

        // Implement only the relevant activities for this workflow
        const mockActivities: Partial<typeof Activities> = {
            generateConfirmationCode: async () => '123456',
            sendConfirmationCodeEmail: async () => {},
            stampDocument: async () => {},
        };
        const worker = await Worker.create({
            connection: nativeConnection,
            taskQueue: 'test',
            workflowsPath: require.resolve('../src/workflows'),
            activities: mockActivities,
        });

        await worker.runUntil(async () => {
            const handle = await workflowClient.start(electronicSignature, {
                args: [{ documentId: uuid4() }],
                workflowId: uuid4(),
                taskQueue: 'test',
            });

            const status = await handle.query(statusQuery);
            expect(status).toBe('PENDING.WAITING_AGREEMENT');

            await testEnv.sleep('2 minutes');

            const statusAfterTimeout = await handle.query(statusQuery);
            expect(statusAfterTimeout).toBe('EXPIRED');

            const result = await handle.result();
            expect(result).toBe('EXPIRED');
        });
    });
});
