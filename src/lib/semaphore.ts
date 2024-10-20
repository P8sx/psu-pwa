export class Semaphore {
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.currentCount = 0
        this.queue = [];
    }

    async acquire() {
        if (this.currentCount < this.maxConcurrency) {
            this.currentCount++;
        } else {
            await new Promise(resolve => this.queue.push(resolve));
        }
    }

    release() {
        this.currentCount--;
        if (this.queue.length > 0) {
            this.queue.shift()();
            this.currentCount++;
        }
    }
}