import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
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

    const documentId = cuid()
    const documentName = `${documentId}.pdf`
    await document.moveToDisk('./', {
      name: documentName,
      contentType: 'application/pdf',
    })

    const connection = new Connection()
    const client = new WorkflowClient(connection.service)
    const handle = client.createWorkflowHandle<ElectronicSignature>('electronicSignature', {
      taskQueue: 'electronic-signature',
    })
    await handle.start({
      documentId,
    })

    return {
      documentURL: documentName,
      procedureUuid: handle.workflowId,
      documentPresignedURL: `http://localhost:3333${await Drive.getSignedUrl(documentName)}`,
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

  public async cancelProcedure({ request }: HttpContextContract): Promise<void> {
    const procedureUuid = request.param('uuid')

    const connection = new Connection()
    const client = new WorkflowClient(connection.service)
    const handle = client.createWorkflowHandle<ElectronicSignature>({ workflowId: procedureUuid })

    await handle.signal.cancelProcedure()
  }

  public async agreeDocument({ request }: HttpContextContract): Promise<void> {
    const procedureUuid = request.param('uuid')

    const connection = new Connection()
    const client = new WorkflowClient(connection.service)
    const handle = client.createWorkflowHandle<ElectronicSignature>({ workflowId: procedureUuid })

    await handle.signal.acceptDocument()
  }

  public async setEmailForCode({ request }: HttpContextContract): Promise<void> {
    const setEmailForCodeSchema = schema.create({
      email: schema.string({}, [rules.email()]),
    })
    const procedureUuid = request.param('uuid')
    const { email } = await request.validate({ schema: setEmailForCodeSchema })

    const connection = new Connection()
    const client = new WorkflowClient(connection.service)
    const handle = client.createWorkflowHandle<ElectronicSignature>({ workflowId: procedureUuid })

    await handle.signal.setEmailForCode(email)
  }

  public async sendConfirmationCode({ request }: HttpContextContract): Promise<void> {
    const sendConfirmationCodeSchema = schema.create({
      code: schema.string({}, [rules.minLength(6), rules.maxLength(6)]),
    })
    const procedureUuid = request.param('uuid')
    const { code } = await request.validate({ schema: sendConfirmationCodeSchema })

    const connection = new Connection()
    const client = new WorkflowClient(connection.service)
    const handle = client.createWorkflowHandle<ElectronicSignature>({ workflowId: procedureUuid })

    await handle.signal.validateConfirmationCode(code)
  }
}
