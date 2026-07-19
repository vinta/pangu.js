export interface TaskSchedulerConfig {
  enabled: boolean;
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
    try {
      while (deadline.timeRemaining() > 0 && this.queue.length > 0) {
        const task = this.queue.shift();
        task?.();
      }
    } finally {
      // A throwing task must not leave isProcessing stuck at true, or every
      // future add() would silently never schedule processing again
      this.isProcessing = false;

      if (this.queue.length > 0) {
        this.scheduleProcessing();
      }
    }
  }
}

/**
 * Runs queued text spacing work during browser idle time to avoid blocking the UI.
 * Tasks execute via requestIdleCallback when the browser has spare time,
 * ensuring smooth user experience even when processing large amounts of text.
 */
export class TaskScheduler {
  public readonly config: TaskSchedulerConfig = {
    enabled: true,
    timeout: 2000, // 2 second timeout for idle processing
  };

  private taskQueue = new TaskQueue();

  get queue() {
    return this.taskQueue;
  }
}
