import {
  ExecutionGraph,
  START,
  END,
  ExecutionContext,
  ConversationMessage,
} from './ExecutionGraph';

describe('ExecutionGraph', () => {
  describe('addVertex', () => {
    it('should add a node with a handler', () => {
      const graph = new ExecutionGraph<string>();
      const result = graph.addVertex('test', async () => 'result');
      expect(result).toBe(true);
      expect(graph.hasVertex('test')).toBe(true);
    });

    it('should return false for duplicate nodes', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('test', async () => 'result');
      const result = graph.addVertex('test', async () => 'other');
      expect(result).toBe(false);
    });
  });

  describe('validate', () => {
    it('should fail if START has no outbound edge', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('node1', async () => 'result');
      graph.setEdge('node1', { to: END });

      const result = graph.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('START must have an outbound edge');
    });

    it('should fail if a node has no outbound edge', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('node1', async () => 'result');
      graph.setEdge(START, { to: 'node1' });
      // Missing edge from node1

      const result = graph.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Node 'node1' has no outbound edge");
    });

    it('should fail if edge targets non-existent node', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('node1', async () => 'result');
      graph.setEdge(START, { to: 'nonexistent' });
      graph.setEdge('node1', { to: END });

      const result = graph.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Edge from 'START' targets non-existent node 'nonexistent'"
      );
    });

    it('should fail if conditional edge has no targets declared', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('node1', async () => 'result');
      graph.setEdge(START, { to: 'node1' });
      graph.setEdge('node1', {
        to: () => END,
        // Missing targets
      });

      const result = graph.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Edge from 'node1' uses a router but doesn't declare 'targets'"
      );
    });

    it('should fail if conditional edge declares non-existent target', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('node1', async () => 'result');
      graph.setEdge(START, { to: 'node1' });
      graph.setEdge('node1', {
        to: () => END,
        targets: ['nonexistent', END],
      });

      const result = graph.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Edge from 'node1' declares non-existent target 'nonexistent'"
      );
    });

    it('should pass for valid simple graph', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('node1', async () => 'result');
      graph.setEdge(START, { to: 'node1' });
      graph.setEdge('node1', { to: END });

      const result = graph.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass for valid conditional graph', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('start', async () => ({ value: 50 }));
      graph.addVertex('high', async () => 'high path');
      graph.addVertex('low', async () => 'low path');

      graph.setEdge(START, { to: 'start' });
      graph.setEdge('start', {
        to: (ctx) => {
          const last = ctx.history[ctx.history.length - 1];
          const output = JSON.parse(last.output);
          return output.value > 75 ? 'high' : 'low';
        },
        targets: ['high', 'low'],
      });
      graph.setEdge('high', { to: END });
      graph.setEdge('low', { to: END });

      const result = graph.validate();
      expect(result.valid).toBe(true);
    });
  });

  describe('execute', () => {
    it('should execute a simple linear graph', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('step1', async () => ({ message: 'step1 done' }));
      graph.addVertex('step2', async () => ({ message: 'step2 done' }));

      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: 'step2' });
      graph.setEdge('step2', { to: END });

      const result = await graph.execute('test input');

      expect(result.success).toBe(true);
      expect(result.path).toEqual(['step1', 'step2']);
      expect(result.context.history).toHaveLength(2);
      expect(result.context.history[0].node).toBe('step1');
      expect(result.context.history[1].node).toBe('step2');
    });

    it('should pass input to handlers via context', async () => {
      const graph = new ExecutionGraph<string>();
      let capturedInput: string | undefined;

      graph.addVertex('step1', async (ctx) => {
        capturedInput = ctx.input as string;
        return 'done';
      });

      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: END });

      await graph.execute('hello world');

      expect(capturedInput).toBe('hello world');
    });

    it('should handle conversation message input', async () => {
      const graph = new ExecutionGraph<string>();
      let capturedInput: ConversationMessage[] | undefined;

      graph.addVertex('step1', async (ctx) => {
        capturedInput = ctx.input as ConversationMessage[];
        return 'done';
      });

      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: END });

      const messages: ConversationMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      await graph.execute(messages);

      expect(capturedInput).toEqual(messages);
    });

    it('should allow handlers to mutate state', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('step1', async (ctx) => {
        ctx.state.count = 1;
        return 'done';
      });
      graph.addVertex('step2', async (ctx) => {
        ctx.state.count = (ctx.state.count as number) + 1;
        return 'done';
      });

      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: 'step2' });
      graph.setEdge('step2', { to: END });

      const result = await graph.execute('input', {});

      expect(result.context.state.count).toBe(2);
    });

    it('should execute conditional edges correctly', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('check', async () => ({ score: 90 }));
      graph.addVertex('pass', async () => ({ result: 'passed!' }));
      graph.addVertex('fail', async () => ({ result: 'failed!' }));

      graph.setEdge(START, { to: 'check' });
      graph.setEdge('check', {
        to: (ctx) => {
          const last = ctx.history[ctx.history.length - 1];
          const output = JSON.parse(last.output);
          return output.score >= 70 ? 'pass' : 'fail';
        },
        targets: ['pass', 'fail'],
      });
      graph.setEdge('pass', { to: END });
      graph.setEdge('fail', { to: END });

      const result = await graph.execute('test');

      expect(result.success).toBe(true);
      expect(result.path).toEqual(['check', 'pass']);
    });

    it('should take fail branch when condition not met', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('check', async () => ({ score: 50 }));
      graph.addVertex('pass', async () => ({ result: 'passed!' }));
      graph.addVertex('fail', async () => ({ result: 'failed!' }));

      graph.setEdge(START, { to: 'check' });
      graph.setEdge('check', {
        to: (ctx) => {
          const last = ctx.history[ctx.history.length - 1];
          const output = JSON.parse(last.output);
          return output.score >= 70 ? 'pass' : 'fail';
        },
        targets: ['pass', 'fail'],
      });
      graph.setEdge('pass', { to: END });
      graph.setEdge('fail', { to: END });

      const result = await graph.execute('test');

      expect(result.success).toBe(true);
      expect(result.path).toEqual(['check', 'fail']);
    });

    it('should handle errors and return them in result', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('step1', async () => {
        throw new Error('Something went wrong');
      });

      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: END });

      const result = await graph.execute('test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Something went wrong');
      expect(result.path).toEqual(['step1']);
    });

    it('should JSON stringify handler output in history', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('step1', async () => ({
        complex: { nested: 'value' },
        array: [1, 2, 3],
      }));

      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: END });

      const result = await graph.execute('test');

      expect(result.context.history[0].output).toBe(
        '{"complex":{"nested":"value"},"array":[1,2,3]}'
      );
    });

    it('should add timestamps to history entries', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('step1', async () => 'done');

      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: END });

      const before = new Date();
      const result = await graph.execute('test');
      const after = new Date();

      const timestamp = result.context.history[0].timestamp;
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should work with custom context type', async () => {
      interface MyContext extends ExecutionContext<string> {
        state: {
          userId: string;
          processedItems: string[];
        };
      }

      const graph = new ExecutionGraph<string, MyContext>();

      graph.addVertex('process', async (ctx) => {
        ctx.state.processedItems.push('item1');
        return { processed: true };
      });

      graph.setEdge(START, { to: 'process' });
      graph.setEdge('process', { to: END });

      const result = await graph.execute('test', {
        userId: 'user123',
        processedItems: [],
      });

      expect(result.context.state.userId).toBe('user123');
      expect(result.context.state.processedItems).toEqual(['item1']);
    });

    it('should fail if no START edge defined', async () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('step1', async () => 'done');
      graph.setEdge('step1', { to: END });

      const result = await graph.execute('test');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('No START edge defined');
    });

    it('should handle synchronous handlers', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('sync', () => ({ sync: true }));

      graph.setEdge(START, { to: 'sync' });
      graph.setEdge('sync', { to: END });

      const result = await graph.execute('test');

      expect(result.success).toBe(true);
      expect(JSON.parse(result.context.history[0].output)).toEqual({ sync: true });
    });

    it('should use state to route conditionally', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('set-flag', async (ctx) => {
        ctx.state.shouldSkip = true;
        return 'flag set';
      });
      graph.addVertex('normal', async () => 'normal path');
      graph.addVertex('skip', async () => 'skipped path');

      graph.setEdge(START, { to: 'set-flag' });
      graph.setEdge('set-flag', {
        to: (ctx) => (ctx.state.shouldSkip ? 'skip' : 'normal'),
        targets: ['skip', 'normal'],
      });
      graph.setEdge('normal', { to: END });
      graph.setEdge('skip', { to: END });

      const result = await graph.execute('test');

      expect(result.path).toEqual(['set-flag', 'skip']);
    });
  });

  describe('static properties', () => {
    it('should expose START and END symbols', () => {
      expect(ExecutionGraph.START).toBe(START);
      expect(ExecutionGraph.END).toBe(END);
    });
  });
});
