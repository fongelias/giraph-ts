// Symbols for START, END, and PAUSE markers
export const START = Symbol('START');
export const END = Symbol('END');
export const PAUSE = Symbol('PAUSE');

export type StartMarker = typeof START;
export type EndMarker = typeof END;
export type PauseMarker = typeof PAUSE;

// Input types
export type Input = string | ConversationMessage[];

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// History entry - appended after each node execution
export interface HistoryEntry<K extends string> {
  node: K;
  output: string;  // JSON stringified
  timestamp: Date;
}

// Base execution context - users can extend this
export interface ExecutionContext<K extends string> {
  readonly input: Input;
  state: Record<string, unknown>;
  readonly history: HistoryEntry<K>[];
}

// Node handler function
export type Handler<K extends string, Ctx extends ExecutionContext<K>> =
  (ctx: Ctx) => Promise<unknown> | unknown;

// Node options
export interface VertexOptions {
  entryPoint?: boolean;
}

// Router function for conditional edges
export type Router<K extends string, Ctx extends ExecutionContext<K>> =
  (ctx: Ctx) => K | EndMarker | PauseMarker;

// Edge configuration
export interface EdgeConfig<K extends string, Ctx extends ExecutionContext<K>> {
  to: K | EndMarker | PauseMarker | Router<K, Ctx>;
  targets?: Array<K | EndMarker | PauseMarker>;  // Required for conditional edges (validation)
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Execution status
export type ExecutionStatus = 'completed' | 'paused' | 'failed';

// Execution result - returns full context
export interface ExecutionResult<K extends string, Ctx extends ExecutionContext<K>> {
  status: ExecutionStatus;
  context: Ctx;
  path: K[];
  pausedAt?: K;       // Node where execution paused (if status === 'paused')
  pauseData?: unknown; // Output from the paused node
  error?: Error;      // Error if status === 'failed'
}

// Hook types
export type HookPoint =
  | 'beforeExecute'
  | 'afterExecute'
  | 'beforeNode'
  | 'afterNode'
  | 'beforeEdge'
  | 'onError';

export interface HookControl {
  abort(error: Error): void;
  skip(): void;
}

interface HookControlState {
  action: 'continue' | 'abort' | 'skip';
  error?: Error;
}

// Hook payloads for each hook point
export interface HookPayloads<K extends string, Ctx extends ExecutionContext<K>> {
  beforeExecute: { context: Ctx };
  afterExecute: { context: Ctx; status: ExecutionStatus };
  beforeNode: { node: K; context: Ctx };
  afterNode: { node: K; output: unknown; context: Ctx };
  beforeEdge: { from: K | StartMarker; to: K | EndMarker | PauseMarker; context: Ctx };
  onError: { node: K; error: Error; context: Ctx };
}

export type HookHandler<K extends string, Ctx extends ExecutionContext<K>, P extends HookPoint> =
  (payload: HookPayloads<K, Ctx>[P], control: HookControl) => void;

/**
 * An execution graph that runs node handlers in sequence with conditional routing.
 * Supports pausing execution and resuming from entry points.
 *
 * @typeParam K - Node key type (string)
 * @typeParam Ctx - Execution context type (extends ExecutionContext)
 */
export class ExecutionGraph<
  K extends string,
  Ctx extends ExecutionContext<K> = ExecutionContext<K>
> {
  public static readonly START = START;
  public static readonly END = END;
  public static readonly PAUSE = PAUSE;

  private handlers: Map<K, Handler<K, Ctx>> = new Map();
  private entryPoints: Set<K> = new Set();
  private edges: Map<K | StartMarker, EdgeConfig<K, Ctx>> = new Map();
  private hooks: Map<HookPoint, Array<HookHandler<K, Ctx, HookPoint>>> = new Map();

  /**
   * Adds a node with its handler function.
   * @param key - Unique node identifier
   * @param handler - Function to execute when node is visited
   * @param options - Node options (e.g., entryPoint)
   * @returns false if the node already exists, true otherwise
   */
  public addVertex(
    key: K,
    handler: Handler<K, Ctx>,
    options?: VertexOptions
  ): boolean {
    if (this.handlers.has(key)) {
      return false;
    }
    this.handlers.set(key, handler);
    if (options?.entryPoint) {
      this.entryPoints.add(key);
    }
    return true;
  }

  /**
   * Checks if a node exists.
   */
  public hasVertex(key: K): boolean {
    return this.handlers.has(key);
  }

  /**
   * Checks if a node is an entry point.
   */
  public isEntryPoint(key: K): boolean {
    return this.entryPoints.has(key);
  }

  /**
   * Sets the outbound edge for a node.
   * Each node can only have one outbound edge (but it can be conditional).
   */
  public setEdge(from: K | StartMarker, edge: EdgeConfig<K, Ctx>): void {
    this.edges.set(from, edge);
  }

  /**
   * Registers a hook handler for a specific hook point.
   * Hooks are called synchronously in registration order.
   */
  public hook<P extends HookPoint>(
    point: P,
    handler: HookHandler<K, Ctx, P>
  ): void {
    if (!this.hooks.has(point)) {
      this.hooks.set(point, []);
    }
    this.hooks.get(point)!.push(handler as HookHandler<K, Ctx, HookPoint>);
  }

  /**
   * Validates that the graph conforms to execution rules:
   * - START must have an outbound edge
   * - Every node must have exactly one outbound edge
   * - All edge targets must exist (or be END/PAUSE)
   * - Conditional edges must declare their targets
   * - Nodes that can route to PAUSE must be entry points
   */
  public validate(): ValidationResult {
    const errors: string[] = [];

    // 1. START must have an outbound edge
    if (!this.edges.has(START)) {
      errors.push('START must have an outbound edge');
    } else {
      this.validateEdgeTargets('START', this.edges.get(START)!, errors);
    }

    // 2. Every node must have exactly one outbound edge
    for (const key of Array.from(this.handlers.keys())) {
      if (!this.edges.has(key)) {
        errors.push(`Node '${key}' has no outbound edge`);
      } else {
        this.validateEdgeTargets(key, this.edges.get(key)!, errors);
      }
    }

    // 3. Check for edges from non-existent nodes (except START)
    for (const [from] of Array.from(this.edges.entries())) {
      if (from !== START && !this.handlers.has(from as K)) {
        errors.push(`Edge defined from non-existent node '${String(from)}'`);
      }
    }

    // 4. Nodes that can route to PAUSE must be entry points
    for (const [from, edge] of Array.from(this.edges.entries())) {
      if (from === START) continue;

      const canPause = edge.to === PAUSE || edge.targets?.includes(PAUSE);
      if (canPause && !this.entryPoints.has(from as K)) {
        errors.push(
          `Node '${String(from)}' can route to PAUSE but is not marked as entryPoint`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validateEdgeTargets(
    from: string,
    edge: EdgeConfig<K, Ctx>,
    errors: string[]
  ): void {
    const isRouter = typeof edge.to === 'function';

    if (isRouter) {
      // Conditional edge must declare targets
      if (!edge.targets || edge.targets.length === 0) {
        errors.push(
          `Edge from '${from}' uses a router but doesn't declare 'targets'`
        );
        return;
      }

      // All declared targets must exist (except END and PAUSE)
      for (const target of edge.targets) {
        if (target !== END && target !== PAUSE && !this.handlers.has(target as K)) {
          errors.push(
            `Edge from '${from}' declares non-existent target '${String(target)}'`
          );
        }
      }
    } else {
      // Static edge - target must exist (except END and PAUSE)
      const target = edge.to;
      if (target !== END && target !== PAUSE && !this.handlers.has(target as K)) {
        errors.push(
          `Edge from '${from}' targets non-existent node '${String(target)}'`
        );
      }
    }
  }

  /**
   * Executes the graph from START to END (or until PAUSE).
   *
   * @param input - The input data (string or conversation)
   * @param initialState - Optional initial state
   * @returns ExecutionResult with full context
   */
  public async execute(
    input: Input,
    initialState?: Ctx['state']
  ): Promise<ExecutionResult<K, Ctx>> {
    const context = {
      input,
      state: initialState ?? {},
      history: [],
    } as unknown as Ctx;

    return this.runExecution(context, START);
  }

  /**
   * Resumes execution from a paused state.
   *
   * @param previousResult - The result from a paused execution
   * @param additionalState - Additional state to merge (e.g., user approval)
   * @returns ExecutionResult with full context
   */
  public async resume(
    previousResult: ExecutionResult<K, Ctx>,
    additionalState?: Partial<Ctx['state']>
  ): Promise<ExecutionResult<K, Ctx>> {
    if (previousResult.status !== 'paused' || !previousResult.pausedAt) {
      throw new Error('Can only resume from a paused execution');
    }

    if (!this.entryPoints.has(previousResult.pausedAt)) {
      throw new Error(
        `Cannot resume from '${previousResult.pausedAt}': not an entry point`
      );
    }

    // Merge additional state into context
    const context = {
      ...previousResult.context,
      state: {
        ...previousResult.context.state,
        ...additionalState,
      },
    } as Ctx;

    return this.runExecution(context, previousResult.pausedAt);
  }

  private async runExecution(
    context: Ctx,
    startFrom: K | StartMarker
  ): Promise<ExecutionResult<K, Ctx>> {
    const path: K[] = [...(startFrom !== START ? context.history.map(h => h.node) : [])];
    const controlState = this.createControlState();

    try {
      // beforeExecute hooks
      this.runHooks('beforeExecute', { context }, controlState);
      if (this.isAborted(controlState)) {
        throw controlState.error!;
      }

      // Determine first node
      let currentNode: K | EndMarker | PauseMarker;
      if (startFrom === START) {
        const startEdge = this.edges.get(START);
        if (!startEdge) {
          throw new Error('No START edge defined');
        }
        currentNode = this.resolveEdge(startEdge, context);
      } else {
        currentNode = startFrom;
      }

      // Execute nodes until we hit END or PAUSE
      while (currentNode !== END && currentNode !== PAUSE) {
        const nodeKey = currentNode as K;

        // beforeNode hooks (before adding to path, so abort doesn't include this node)
        controlState.action = 'continue';
        this.runHooks('beforeNode', { node: nodeKey, context }, controlState);
        if (this.isAborted(controlState)) {
          throw controlState.error!;
        }

        // Add to path after beforeNode hooks (so aborted nodes aren't in path)
        if (!path.includes(nodeKey)) {
          path.push(nodeKey);
        }

        // Execute handler (unless skipped)
        let output: unknown;
        if (!this.isSkipped(controlState)) {
          const handler = this.handlers.get(nodeKey);
          if (!handler) {
            throw new Error(`No handler for node '${nodeKey}'`);
          }

          try {
            output = await handler(context);
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            controlState.action = 'continue';
            this.runHooks('onError', { node: nodeKey, error: err, context }, controlState);
            if (this.isAborted(controlState)) {
              throw controlState.error ?? err;
            }
            throw err;
          }

          // Append to history
          const historyEntry: HistoryEntry<K> = {
            node: nodeKey,
            output: JSON.stringify(output),
            timestamp: new Date(),
          };
          (context.history as HistoryEntry<K>[]).push(historyEntry);
        }

        // afterNode hooks
        controlState.action = 'continue';
        this.runHooks('afterNode', { node: nodeKey, output, context }, controlState);
        if (this.isAborted(controlState)) {
          throw controlState.error!;
        }

        // Get next node
        const edge = this.edges.get(nodeKey);
        if (!edge) {
          throw new Error(`No edge from node '${nodeKey}'`);
        }

        const nextNode = this.resolveEdge(edge, context);

        // beforeEdge hooks
        controlState.action = 'continue';
        this.runHooks('beforeEdge', { from: nodeKey, to: nextNode, context }, controlState);
        if (this.isAborted(controlState)) {
          throw controlState.error!;
        }

        // Check for PAUSE
        if (nextNode === PAUSE) {
          // afterExecute hooks
          this.runHooks('afterExecute', { context, status: 'paused' }, controlState);

          return {
            status: 'paused',
            context,
            path,
            pausedAt: nodeKey,
            pauseData: output,
          };
        }

        currentNode = nextNode;
      }

      // afterExecute hooks
      this.runHooks('afterExecute', { context, status: 'completed' }, controlState);

      return {
        status: 'completed',
        context,
        path,
      };
    } catch (error) {
      // afterExecute hooks (for failed status)
      this.runHooks('afterExecute', { context, status: 'failed' }, controlState);

      return {
        status: 'failed',
        context,
        path,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private resolveEdge(
    edge: EdgeConfig<K, Ctx>,
    context: Ctx
  ): K | EndMarker | PauseMarker {
    if (typeof edge.to === 'function') {
      return edge.to(context);
    }
    return edge.to;
  }

  private createControlState(): HookControlState {
    return { action: 'continue' };
  }

  private isAborted(state: HookControlState): boolean {
    return state.action === 'abort';
  }

  private isSkipped(state: HookControlState): boolean {
    return state.action === 'skip';
  }

  private createHookControl(state: HookControlState): HookControl {
    return {
      abort: (error: Error) => {
        state.action = 'abort';
        state.error = error;
      },
      skip: () => {
        state.action = 'skip';
      },
    };
  }

  private runHooks<P extends HookPoint>(
    point: P,
    payload: HookPayloads<K, Ctx>[P],
    controlState: HookControlState
  ): void {
    const handlers = this.hooks.get(point);
    if (!handlers) return;

    const control = this.createHookControl(controlState);
    for (const handler of handlers) {
      handler(payload, control);
      if (controlState.action !== 'continue') {
        break;
      }
    }
  }
}
