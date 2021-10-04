import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { cuid } from '@ioc:Adonis/Core/Helpers'

export default class ElectronicSignaturesController {
  public async create({ request }: HttpContextContract): Promise<void> {
    const createProcedureSchema = schema.create({
      document: schema.file({
        size: '10mb',
        extnames: ['pdf'],
      }),
    })
    const payload = await request.validate({ schema: createProcedureSchema })

    const documentPath = `./`
    const document = payload.document

    await document.moveToDisk(documentPath, {
      visibility: 'private',
      contentType: 'application/pdf',
    })
  }
}
