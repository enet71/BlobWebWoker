import { WorkerCb, WorkerError, WorkerNext } from './blob-web-worker.interface';

export class BlobWebWorker {

    private webWorker: Worker;
    private workerUrl: string;

    constructor(cb: WorkerCb) {
        this.createWorker(cb);
    };

    private createWorker(cb: WorkerCb): void {
        const stringWorker = `
            self.addEventListener('message', (messageEvent) => {
                (${cb.toString()})(messageEvent.data)
            })`;

        const blob = new Blob([stringWorker], {type: 'text/javascript'});

        this.workerUrl = URL.createObjectURL(blob);
        this.webWorker = new Worker(this.workerUrl);
    }

    public run(data: any) {
        const observer = new Observer(this.webWorker);
        this.webWorker.postMessage(data);
        return observer;
    }

    public destroy() {
        this.webWorker.terminate();
        URL.revokeObjectURL(this.workerUrl);
    }
}

class Observer {

    private next: WorkerNext;
    private error: WorkerError;

    constructor(public webWorker: Worker) {
        this.webWorker = webWorker;

        this.createListeners();
    }

    private createListeners() {
        this.webWorker.addEventListener('message', (messageEvent: MessageEvent) => this.next(messageEvent.data));
        this.webWorker.addEventListener('error', (errorEvent: ErrorEvent) => this.error(errorEvent));
    }

    public onMessage(next: WorkerNext, error: WorkerError) {
        this.next = next || Function;
        this.error = error || (() => {
        });
    };
}
