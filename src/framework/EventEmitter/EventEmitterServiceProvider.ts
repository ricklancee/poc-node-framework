import { EventEmitter, EventEmitterBinding } from './EventEmitter'
import { NodeEventEmitter } from './NodeEventEmitter'
import { ServiceProvider } from '../Container/ServiceProvider'

export class EventEmitterServiceProvider extends ServiceProvider {
    public register() {
        this.container
            .bind<EventEmitter>(EventEmitterBinding)
            .to(NodeEventEmitter)
            .inSingletonScope()
    }
}
