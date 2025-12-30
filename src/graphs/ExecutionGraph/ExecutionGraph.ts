// Symbols for START and END markers
export const START = Symbol('START');
export const END = Symbol('END');

export type StartMarker = typeof START;
export type EndMarker = typeof END;

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

// Router function for conditional edges
export type Router<K extends string, Ctx extends ExecutionContext<K>> =
  (ctx: Ctx) => K | EndMarker;

// Edge configuration
export interface EdgeConfig<K extends string, Ctx extends ExecutionContext<K>> {
  to: K | EndMarker | Router<K, Ctx>;
  targets?: Array<K | EndMarker>;  // Required for conditional edges (validation)
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Execution result - returns full context
export interface ExecutionResult<K extends string, Ctx extends ExecutionContext<K>> {
  success: boolean;
  context: Ctx;
  path: K[];
  error?: Error;
}

/**
 * An execution graph that runs node handlers in sequence with conditional routing.
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

  private handlers: Map<K, Handler<K, Ctx>> = new Map();
  private edges: Map<K | StartMarker, EdgeConfig<K, Ctx>> = new Map();

  /**
   * Adds a node with its handler function.
   * @returns false if the node already exists, true otherwise
   */
  public addVertex(key: K, handler: Handler<K, Ctx>): boolean {
    if (this.handlers.has(key)) {
      return false;
    }
    this.handlers.set(key, handler);
    return true;
  }

  /**
   * Checks if a node exists.
   */
  public hasVertex(key: K): boolean {
    return this.handlers.has(key);
  }

  /**
   * Sets the outbound edge for a node.
   * Each node can only have one outbound edge (but it can be conditional).
   */
  public setEdge(from: K | StartMarker, edge: EdgeConfig<K, Ctx>): void {
    this.edges.set(from, edge);
  }

  /**
   * Validates that the graph conforms to execution rules:
   * - START must have an outbound edge
   * - Every node must have exactly one outbound edge
   * - All edge targets must exist (or be END)
   * - Conditional edges must declare their targets
   */
  public validate(): ValidationResult {
    const errors: string[] = [];

    // 1. START must have an outbound edge
    if (!this.edges.has(START)) {
      errors.push('START must have an outbound edge');
    } else {
      // Validate START edge targets
      this.validateEdgeTargets('START', this.edges.get(START)!, errors);
    }

    // 2. Every node must have exactly one outbound edge
    for (const key of this.handlers.keys()) {
      if (!this.edges.has(key)) {
        errors.push(`Node '${key}' has no outbound edge`);
      } else {
        // Validate edge targets exist
        this.validateEdgeTargets(key, this.edges.get(key)!, errors);
      }
    }

    // 3. Check for edges from non-existent nodes (except START)
    for (const [from] of this.edges) {
      if (from !== START && !this.handlers.has(from as K)) {
        errors.push(`Edge defined from non-existent node '${String(from)}'`);
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

      // All declared targets must exist
      for (const target of edge.targets) {
        if (target !== END && !this.handlers.has(target as K)) {
          errors.push(
            `Edge from '${from}' declares non-existent target '${String(target)}'`
          );
        }
      }
    } else {
      // Static edge - target must exist
      const target = edge.to;
      if (target !== END && !this.handlers.has(target as K)) {
        errors.push(
          `Edge from '${from}' targets non-existent node '${String(target)}'`
        );
      }
    }
  }

  /**
   * Executes the graph from START to END.
   *
   * @param input - The input data (string or conversation)
   * @param initialState - Optional initial state
   * @returns ExecutionResult with full context
   */
  public async execute(
    input: Input,
    initialState?: Ctx['state']
  ): Promise<ExecutionResult<K, Ctx>> {
    // Build initial context
    const context = {
      input,
      state: initialState ?? {},
      history: [],
    } as Ctx;

    const path: K[] = [];

    try {
      // Get first node from START edge
      const startEdge = this.edges.get(START);
      if (!startEdge) {
        throw new Error('No START edge defined');
      }

      let currentNode = this.resolveEdge(startEdge, context);

      // Execute nodes until we hit END
      while (currentNode !== END) {
        const nodeKey = currentNode as K;
        path.push(nodeKey);

        // Get and execute handler
        const handler = this.handlers.get(nodeKey);
        if (!handler) {
          throw new Error(`No handler for node '${nodeKey}'`);
        }

        const output = await handler(context);

        // Append to history
        const historyEntry: HistoryEntry<K> = {
          node: nodeKey,
          output: JSON.stringify(output),
          timestamp: new Date(),
        };
        (context.history as HistoryEntry<K>[]).push(historyEntry);

        // Get next node
        const edge = this.edges.get(nodeKey);
        if (!edge) {
          throw new Error(`No edge from node '${nodeKey}'`);
        }

        currentNode = this.resolveEdge(edge, context);
      }

      return {
        success: true,
        context,
        path,
      };
    } catch (error) {
      return {
        success: false,
        context,
        path,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private resolveEdge(
    edge: EdgeConfig<K, Ctx>,
    context: Ctx
  ): K | EndMarker {
    if (typeof edge.to === 'function') {
      return edge.to(context);
    }
    return edge.to;
  }
}
