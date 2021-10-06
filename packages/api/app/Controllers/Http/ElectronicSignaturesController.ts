import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Drive from '@ioc:Adonis/Core/Drive'
import { Connection, WorkflowClient } from '@temporalio/client'
import {
  ElectronicSignature,
  ElectronicSignatureProcedureStatus,
} from '@temporal-electronic-signature/temporal/lib/interfaces'

export default class ElectronicSignaturesController {
  public async create({ request }: HttpContextContract): Promise<{
    procedureUuid: string
    documentURL: string
    documentPresignedURL: string
  }> {
    const createProcedureSchema = schema.create({
      document: schema.file({
        size: '10mb',
        extnames: ['pdf'],
      }),
    })
    const { document } = await request.validate({ schema: createProcedureSchema })

    const documentName = `${cuid()}.pdf`
    await document.moveToDisk('./', {
      name: documentName,
      contentType: 'application/pdf',
    })

    const connection = new Connection()
    const client = new WorkflowClient(connection.service)
    const handle = client.createWorkflowHandle<ElectronicSignature>('electronicSignature', {
      taskQueue: 'electronic-signature',
    })
    await handle.start() // kick off the purchase async

    return {
      documentURL: documentName,
      procedureUuid: handle.workflowId,
      documentPresignedURL: await Drive.getSignedUrl(documentName, {
        expiresIn: '30 minutes',
      }),
    }
  }

  public async status({
    request,
  }: HttpContextContract): Promise<ElectronicSignatureProcedureStatus> {
    const procedureUuid = request.param('uuid')

    const connection = new Connection()
    const client = new WorkflowClient(connection.service)
    const handle = client.createWorkflowHandle<ElectronicSignature>({ workflowId: procedureUuid })

    const status = await handle.query.status()

    return status
  }
}
