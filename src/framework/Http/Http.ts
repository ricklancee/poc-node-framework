import { Kernel, BootCallback } from '../Kernel'
import { injectable, inject } from 'inversify'
import { HttpServer, HttpServerBinding } from './HttpServer'
import { Request, Response, NextFunction } from 'express'
import { HttpMiddleware } from './HttpMiddleware'
import { Newable } from '../Newable'
import { Application, AppBinding } from '../App'
import { RouterBinding, Router } from './Router'
import { Route } from './Route'

@injectable()
export abstract class Http extends Kernel {
    @inject(HttpServerBinding)
    private server: HttpServer

    @inject(AppBinding)
    private application: Application

    @inject(RouterBinding)
    private router: Router

    protected middleware: Newable<HttpMiddleware>[] = []

    protected routes: Newable<Route>[] = []

    public boot(callback: BootCallback) {
        // Register middleware into the server
        for (const Middleware of this.middleware) {
            const middleware = this.application.make<HttpMiddleware>(Middleware)
            const pathname = middleware.pathname ? middleware.pathname : '*'
            this.server.use(pathname, (req, res, next) => {
                middleware.handle(req, res, next)
            })
        }

        const possibleMethods = ['get', 'post', 'put', 'delete', 'handle']

        for (const Route of this.routes) {
            const route = this.application.make<Route>(Route)

            for (const method of possibleMethods) {
                if (route[method]) {
                    if (method === 'handle') {
                        this.router.use(
                            route.pathname,
                            route[method].bind(route)
                        )
                        continue
                    }
                    this.router[method](
                        route.pathname,
                        route[method].bind(route)
                    )
                }
            }
        }

        for (const [methodType, handlers] of Object.entries(
            this.router.routes
        )) {
            const method = methodType.toLowerCase()
            if (method in this.server) {
                for (const handler of handlers) {
                    this.server[method](handler.pathname, handler.handler)
                }
            }
        }

        // This is the error handler and should be the last middleware
        this.server.use(
            async (
                err: Error,
                req: Request,
                res: Response,
                next: NextFunction
            ) => {
                await this.exceptionHandler.report(err)
                res.status(500).send(':(')
            }
        )

        this.server.start(address => {
            this.logger.info(`server listening on ${address}`)
            callback()
        })
    }
}
