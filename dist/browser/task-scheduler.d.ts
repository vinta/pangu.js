export interface TaskSchedulerConfig {
    enabled: boolean;
    chunkSize: number;
    timeout: number;
}
export declare class TaskQueue {
    private queue;
    private isProcessing;
    add(task: () => void): void;
    clear(): void;
    get length(): number;
    private scheduleProcessing;
    private process;
}
/**
 * Runs queued text spacing work during browser idle time to avoid blocking the UI.
 * Tasks execute via requestIdleCallback when the browser has spare time,
 * ensuring smooth user experience even when processing large amounts of text.
 */
export declare class TaskScheduler {
    readonly config: TaskSchedulerConfig;
    private taskQueue;
    get queue(): TaskQueue;
}
