import { Connection, WorkflowClient } from '@temporalio/client'

export const TASK_QUEUE = 'electronic-signature'

export let temporalClient: WorkflowClient

export async function configureTemporalClient() {
  const connection = await Connection.connect({})

  const client = new WorkflowClient({
    connection,
  })

  temporalClient = client
}
