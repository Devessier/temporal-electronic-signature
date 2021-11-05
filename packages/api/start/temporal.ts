import { Connection, WorkflowClient } from '@temporalio/client'

function createTemporalClient() {
  const connection = new Connection()
  const client = new WorkflowClient(connection.service, {
    workflowDefaults: {
      taskQueue: 'electronic-signature',
    },
  })

  return client
}

export const temporalClient = createTemporalClient()
