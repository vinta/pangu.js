export interface TaskSchedulerConfig {
  enabled: boolean;
  chunkSize: number;
  timeout: number;
}

export class TaskQueue {
  private queue: (() => void)[] = [];
  private isProcessing = false;

  add(task: () => void) {
    this.queue.push(task);
    this.scheduleProcessing();
  }

  clear() {
    this.queue.length = 0;
  }

  get length() {
    return this.queue.length;
  }

  private scheduleProcessing() {
    if (!this.isProcessing && this.queue.length > 0) {
      this.isProcessing = true;
      requestIdleCallback((deadline) => this.process(deadline), { timeout: 5000 });
    }
  }

  private process(deadline: IdleDeadline) {
    while (deadline.timeRemaining() > 0 && this.queue.length > 0) {
      const task = this.queue.shift();
      task?.();
    }

    this.isProcessing = false;

    if (this.queue.length > 0) {
      this.scheduleProcessing();
    }
  }
}

/**
 * Schedules and executes text spacing operations during browser idle time to avoid blocking the UI.
 * Uses requestIdleCallback to process task in chunks when the browser has spare time,
 * ensuring smooth user experience even when processing large amounts of text.
 */
export class TaskScheduler {
  public readonly config: TaskSchedulerConfig = {
    enabled: true,
    chunkSize: 40, // Process 40 text nodes per idle cycle
    timeout: 2000, // 2 second timeout for idle processing
  };

  private taskQueue = new TaskQueue();

  get queue() {
    return this.taskQueue;
  }

  processInChunks<T>(items: T[], processor: (chunk: T[]) => void) {
    if (!this.config.enabled) {
      // Process synchronously if idle processing is disabled
      processor(items);
      return;
    }

    if (items.length === 0) {
      return;
    }

    // Split items into chunks
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += this.config.chunkSize) {
      chunks.push(items.slice(i, i + this.config.chunkSize));
    }

    // Add each chunk as a task item to the task queue
    for (const chunk of chunks) {
      this.taskQueue.add(() => {
        processor(chunk);
      });
    }
  }
}
