import {
    HttpServer,
    HttpServerOptions,
    HttpServerOptionsBinding,
    StartCallback,
} from './HttpServer'
import { inject, injectable } from 'inversify'
import express, { Express, IRouterMatcher } from 'express'
import { ApplicationRequestHandler } from 'express-serve-static-core'

@injectable()
export class ExpressHttpServer implements HttpServer {
    private server: Express

    constructor(
        @inject(HttpServerOptionsBinding) private config: HttpServerOptions
    ) {
        this.server = express()

        if (config.trustProxy) {
            this.server.set('trust proxy', true)
        }

        this.use = this.server.use.bind(this.server)
        this.get = this.server.get.bind(this.server)
        this.post = this.server.post.bind(this.server)
        this.put = this.server.put.bind(this.server)
        this.delete = this.server.delete.bind(this.server)
        this.patch = this.server.patch.bind(this.server)
        this.options = this.server.options.bind(this.server)
    }

    public use: ApplicationRequestHandler<this>
    public get: IRouterMatcher<this>
    public post: IRouterMatcher<this>
    public put: IRouterMatcher<this>
    public delete: IRouterMatcher<this>
    public patch: IRouterMatcher<this>
    public options: IRouterMatcher<this>

    public async start(callback: StartCallback) {
        this.server.listen(this.config.port, () => {
            callback(`http://localhost:${this.config.port}`)
        })
    }
}
