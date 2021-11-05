import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Drive from '@ioc:Adonis/Core/Drive'
import type { QueryDefinition, SignalDefinition } from '@temporalio/common'
import type {
  acceptDocumentSignal,
  cancelProcedureSignal,
  electronicSignature,
  ElectronicSignatureProcedureStatus,
  setEmailForCodeSignal,
  statusQuery,
  validateConfirmationCodeSignal,
} from '@temporal-electronic-signature/temporal/lib/types'
import { temporalClient } from '../../../start/temporal'

type QueryReturn<Query> = Query extends QueryDefinition<infer ReturnValue, unknown[]>
  ? ReturnValue
  : never
type QueryArgs<Query> = Query extends QueryDefinition<unknown, infer Args> ? Args : never
type SignalArgs<Signal> = Signal extends SignalDefinition<infer Args> ? Args : never

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

    const handle = await temporalClient.start<typeof electronicSignature>('electronicSignature', {
      args: [
        {
          documentId,
        },
      ],
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

    const handle = temporalClient.getHandle<typeof electronicSignature>(procedureUuid)

    const status = await handle.query<QueryReturn<typeof statusQuery>>('status')

    return status
  }

  public async cancelProcedure({ request }: HttpContextContract): Promise<void> {
    const procedureUuid = request.param('uuid')

    const handle = temporalClient.getHandle<typeof electronicSignature>(procedureUuid)

    await handle.signal<SignalArgs<typeof cancelProcedureSignal>>('cancelProcedure')
  }

  public async agreeDocument({ request }: HttpContextContract): Promise<void> {
    const procedureUuid = request.param('uuid')

    const handle = temporalClient.getHandle<typeof electronicSignature>(procedureUuid)

    await handle.signal<SignalArgs<typeof acceptDocumentSignal>>('acceptDocument')
  }

  public async setEmailForCode({ request }: HttpContextContract): Promise<void> {
    const setEmailForCodeSchema = schema.create({
      email: schema.string({}, [rules.email()]),
    })
    const procedureUuid = request.param('uuid')
    const { email } = await request.validate({ schema: setEmailForCodeSchema })

    const handle = temporalClient.getHandle<typeof electronicSignature>(procedureUuid)

    await handle.signal<SignalArgs<typeof setEmailForCodeSignal>>('setEmailForCode', { email })
  }

  public async sendConfirmationCode({ request }: HttpContextContract): Promise<void> {
    const sendConfirmationCodeSchema = schema.create({
      code: schema.string({}, [rules.minLength(6), rules.maxLength(6)]),
    })
    const procedureUuid = request.param('uuid')
    const { code } = await request.validate({ schema: sendConfirmationCodeSchema })

    const handle = temporalClient.getHandle<typeof electronicSignature>(procedureUuid)

    await handle.signal<SignalArgs<typeof validateConfirmationCodeSignal>>(
      'validateConfirmationCode',
      {
        confirmationCode: code,
      }
    )
  }

  public async stampDocument({ request }: HttpContextContract): Promise<void> {
    const procedureUuid = request.param('uuid')
    const procedureDocumentPath = `./${procedureUuid}.pdf`
    const procedureDocumentBuffer = await Drive.get(procedureDocumentPath)

    const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')

    const pdfDoc = await PDFDocument.load(procedureDocumentBuffer)

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()

    for (const page of pages) {
      const { width, height } = page.getSize()

      page.drawText('Temporal Node.js SDK', {
        x: width / 2 - 175,
        y: height / 2 + 200,
        size: 50,
        font: helveticaFont,
        color: rgb(0.95, 0.1, 0.1),
        rotate: degrees(-45),
      })
    }

    const updatedDocumentBuffer = await pdfDoc.save()

    await Drive.put(procedureDocumentPath, updatedDocumentBuffer as Buffer)
  }
}
