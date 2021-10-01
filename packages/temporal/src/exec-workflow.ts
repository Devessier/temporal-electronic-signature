import { Connection, WorkflowClient } from '@temporalio/client';
import { createMachine, interpret } from 'xstate';
import { electronicSignature } from './workflows';

const interactWithElectronicSignatureWorkflowMachine = createMachine({
    initial: 'idle',

    states: {
        idle: {
            after: {
                1_000: {
                    target: 'watchedDocument',

                    actions: 'sendWatchedDocument',
                },
            },
        },

        watchedDocument: {
            type: 'final',
        },
    },
});

async function run() {
    // Connect to localhost with default ConnectionOptions,
    // pass options to the Connection constructor to configure TLS and other settings.
    const connection = new Connection();
    // Workflows will be started in the "default" namespace unless specified otherwise
    // via options passed the WorkflowClient constructor.
    const client = new WorkflowClient(connection.service);
    // Create a typed handle for the example Workflow.
    const workflow = client.createWorkflowHandle(electronicSignature, {
        taskQueue: 'electronic-signature',
    });
    await workflow.start();

    const service = interpret(
        interactWithElectronicSignatureWorkflowMachine.withConfig({
            actions: {
                sendWatchedDocument: () => {
                    workflow.signal.watchedDocument();
                },
            },
        }),
    ).start();

    await new Promise((resolve) => {
        service.onDone(resolve);
    });
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
