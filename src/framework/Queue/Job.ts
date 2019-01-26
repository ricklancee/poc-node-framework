import { Queue, QueueBinding } from './Queue'
import { injectable, inject } from 'inversify'

export interface ScheduledJob {
    schedule: string
}

export interface NewableJob {
    new (...args: any[]): Job
    onQueue: string
    concurrency: number
}

@injectable()
export abstract class Job<TJobPayload extends object = {}> {
    @inject(QueueBinding)
    private queue: Queue

    public static onQueue: string = 'jobs'
    public static concurrency: number = 2

    public async dispatch(payload: TJobPayload): Promise<void> {
        // Could possible add more options here like, delay timeout etc.
        await this.queue.add((this.constructor as NewableJob).onQueue, payload)
    }

    public handle(args: TJobPayload): Promise<void> | void {
        throw new Error(
            `Handle is not implemented in job: ${this.constructor.name}`
        )
    }
}
