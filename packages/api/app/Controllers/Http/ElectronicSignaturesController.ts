import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
export default class ElectronicSignaturesController {
  public async create({ request }: HttpContextContract): Promise<void> {
    const createProcedureSchema = schema.create({
      document: schema.file({
        size: '10mb',
        extnames: ['pdf'],
      }),
    })
    const { document } = await request.validate({ schema: createProcedureSchema })

    await document.moveToDisk('./', {
      contentType: 'application/pdf',
    })
  }
}
