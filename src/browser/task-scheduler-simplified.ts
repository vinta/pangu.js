// Simplified task scheduler that only handles async processing
export class SimpleTaskQueue {
  private tasks: (() => void | Promise<void>)[] = [];
  private processing = false;

  async add(task: () => void | Promise<void>): Promise<void> {
    this.tasks.push(task);
    if (!this.processing) {
      await this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.tasks.length > 0) {
      // Wait for idle time
      await new Promise<IdleDeadline>(resolve => {
        requestIdleCallback(resolve, { timeout: 5000 });
      });

      // Process tasks while we have idle time
      while (this.tasks.length > 0) {
        const task = this.tasks.shift();
        if (task) {
          await task();
        }
      }
    }

    this.processing = false;
  }

  clear(): void {
    this.tasks = [];
  }
}