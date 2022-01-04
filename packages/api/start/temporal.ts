import { Connection, WorkflowClient } from '@temporalio/client'

export const TASK_QUEUE = 'electronic-signature'

function createTemporalClient() {
  const connection = new Connection()
  const client = new WorkflowClient(connection.service)

  return client
}

export const temporalClient = createTemporalClient()
