import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { cuid } from '@ioc:Adonis/Core/Helpers'

export default class ElectronicSignaturesController {
  public async create({ request }: HttpContextContract): Promise<{
    procedureUuid: string
    documentURL: string
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

    return {
      documentURL: documentName,
      procedureUuid: cuid(),
    }
  }
}
