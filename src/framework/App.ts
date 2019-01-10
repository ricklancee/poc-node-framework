import { HttpServerOptions } from './Http/HttpServer'
import { Container, injectable, interfaces } from 'inversify'
import { NewableServiceProvider, ProvidesService } from './ServiceProvider'
import { Kernel, KernelBinding } from './Kernel'
import { GraphQLOptions } from './GraphQL/GraphQL'
import { Newable } from './Newable'
import { LoggerBinding, Logger } from './Logger/Logger'
import { EventEmitterBinding, EventEmitter } from './EventEmitter/EventEmitter'
import { Router, RouterBinding } from './Http/Router'

export const enum ApplicationEnvironment {
    development = 'DEVELOPMENT',
    production = 'PRODUCTION',
}

export interface ApplicationConfig {
    readonly env: ApplicationEnvironment
    readonly http: HttpServerOptions
    readonly graphql: GraphQLOptions
}

export const ApplicationConfigBinding = Symbol.for('ApplicationConfigBinding')
export const AppBinding = Symbol.for('AppBinding')

type MakeFN = <T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) => T

@injectable()
export class Application {
    private readonly container: Container
    private readonly providers = new Set<ProvidesService>()

    public log = () => this.container.get<Logger>(LoggerBinding)
    public event = () => this.container.get<EventEmitter>(EventEmitterBinding)
    public router = () => this.container.get<Router>(RouterBinding)

    constructor(config: ApplicationConfig) {
        this.container = new Container()

        this.container
            .bind<ApplicationConfig>(ApplicationConfigBinding)
            .toConstantValue(config)

        this.make = this.container.get.bind(this.container)

        this.container.bind(AppBinding).toConstantValue(this)
    }

    public config(): ApplicationConfig {
        return this.container.get<ApplicationConfig>(ApplicationConfigBinding)
    }

    public register(providers: NewableServiceProvider[]) {
        const applicationConfig = this.container.get<ApplicationConfig>(
            ApplicationConfigBinding
        )

        providers.forEach(Provider => {
            this.providers.add(new Provider(this.container, applicationConfig))
        })
    }

    public make: MakeFN

    public kernel(kernel: Newable<Kernel>) {
        this.container
            .bind<Kernel>(KernelBinding)
            .to(kernel)
            .inSingletonScope()
    }

    public async boot(callback?: () => void) {
        for (const provider of this.providers) {
            await provider.register()
        }

        const cb = callback
            ? callback
            : () => {
                  /** noop */
                  // tslint:disable-next-line:ter-indent
              }

        await this.getKernel().boot(cb)
    }

    private getKernel() {
        try {
            return this.container.get<Kernel>(KernelBinding)
        } catch (err) {
            throw new Error(
                `Cannot find registered kernel class, reason:\n\t"${
                    err.message
                }"\n\tPossible solution: Has the kernel class been registered to the application?`
            )
        }
    }
}
