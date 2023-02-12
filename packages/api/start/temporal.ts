import { Connection, WorkflowClient } from '@temporalio/client'

export const TASK_QUEUE = 'electronic-signature'

export async function setUpTemporalClient() {
  const connection = await Connection.connect()

  temporalClient = new WorkflowClient({
    connection,
  })
}

export let temporalClient: WorkflowClient
