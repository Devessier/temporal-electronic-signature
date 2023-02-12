import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {}

  public async ready() {
    // App is ready
    if (this.app.environment !== 'web') {
      return
    }

    const { setUpTemporalClient } = await import('../start/temporal')

    await setUpTemporalClient()
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
