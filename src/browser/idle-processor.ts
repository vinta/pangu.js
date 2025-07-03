export interface IdleSpacingConfig {
  enabled: boolean;
  chunkSize: number;
  timeout: number;
}

export class IdleQueue {
  private queue: (() => void)[] = [];
  private isProcessing = false;
  private onComplete?: () => void;

  constructor() {
    // No fallback - require native requestIdleCallback
  }

  add(work: () => void) {
    this.queue.push(work);
    this.scheduleProcessing();
  }

  clear() {
    this.queue.length = 0;
    this.onComplete = undefined;
  }

  setOnComplete(onComplete?: () => void) {
    this.onComplete = onComplete;
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
      const work = this.queue.shift();
      work?.();
    }

    this.isProcessing = false;

    if (this.queue.length > 0) {
      this.scheduleProcessing();
    } else {
      // All work completed, call completion callback
      this.onComplete?.();
    }
  }
}

export class IdleProcessor {
  public readonly config: IdleSpacingConfig = {
    enabled: true,
    chunkSize: 40, // Process 40 text nodes per idle cycle
    timeout: 2000, // 2 second timeout for idle processing
  };

  private idleQueue = new IdleQueue();

  get queue() {
    return this.idleQueue;
  }

  updateConfig(config: Partial<IdleSpacingConfig>) {
    Object.assign(this.config, config);
  }

  getConfig() {
    return { ...this.config };
  }

  processInChunks<T>(
    items: T[],
    processor: (chunk: T[]) => void,
    onComplete?: () => void
  ) {
    if (!this.config.enabled) {
      // Process synchronously if idle processing is disabled
      processor(items);
      onComplete?.();
      return;
    }

    if (items.length === 0) {
      onComplete?.();
      return;
    }

    // Set up completion callback
    if (onComplete) {
      this.idleQueue.setOnComplete(onComplete);
    }

    // Split items into chunks
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += this.config.chunkSize) {
      chunks.push(items.slice(i, i + this.config.chunkSize));
    }

    // Add each chunk as a work item to the idle queue
    for (const chunk of chunks) {
      this.idleQueue.add(() => {
        processor(chunk);
      });
    }
  }

  clear() {
    this.idleQueue.clear();
  }
}