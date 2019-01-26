import { ApplicationConfig, ApplicationEnvironment } from '../framework/App'
import { MailJob } from '../app/Jobs/MailJob'

export interface ExtendedAppConfig extends ApplicationConfig {}

export const config: Readonly<ExtendedAppConfig> = {
    env: ApplicationEnvironment.development,
    http: {
        port: 3000,
    },
    redis: {
        port: 6379,
        host: '127.0.0.1',
        family: 4,
        password: undefined,
        db: 0,
    },
    queue: {
        jobs: [MailJob],
    },
}
