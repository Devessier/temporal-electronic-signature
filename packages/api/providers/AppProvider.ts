import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    const Minio = await import('minio')

    const client = new Minio.Client({
      endPoint: 'localhost',
      useSSL: false,
      port: 9100,
      accessKey: Env.get('S3_KEY'),
      secretKey: Env.get('S3_SECRET'),
    })

    const bucketExists = await client.bucketExists('documents')
    if (bucketExists === true) {
      return
    }

    await client.makeBucket('documents', 'fr-FR')

    // client.setBucketPolicy('documents', )
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
