import {
  ExecutionGraph,
  START,
  END,
  PAUSE,
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

    it('should mark node as entry point when option is set', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('test', async () => 'result', { entryPoint: true });
      expect(graph.isEntryPoint('test')).toBe(true);
    });

    it('should not mark node as entry point by default', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('test', async () => 'result');
      expect(graph.isEntryPoint('test')).toBe(false);
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

    it('should fail if node can PAUSE but is not an entry point', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('node1', async () => 'result');
      graph.setEdge(START, { to: 'node1' });
      graph.setEdge('node1', { to: PAUSE }); // Not an entry point!

      const result = graph.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Node 'node1' can route to PAUSE but is not marked as entryPoint"
      );
    });

    it('should pass when PAUSE node is marked as entry point', () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('node1', async () => 'result', { entryPoint: true });
      graph.setEdge(START, { to: 'node1' });
      graph.setEdge('node1', { to: PAUSE });

      const result = graph.validate();
      expect(result.valid).toBe(true);
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

      expect(result.status).toBe('completed');
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

      expect(result.status).toBe('completed');
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

      expect(result.status).toBe('completed');
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

      expect(result.status).toBe('failed');
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

      expect(result.status).toBe('failed');
      expect(result.error?.message).toBe('No START edge defined');
    });

    it('should handle synchronous handlers', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('sync', () => ({ sync: true }));

      graph.setEdge(START, { to: 'sync' });
      graph.setEdge('sync', { to: END });

      const result = await graph.execute('test');

      expect(result.status).toBe('completed');
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

  describe('PAUSE and resume', () => {
    it('should pause execution when edge routes to PAUSE', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('analyze', async () => ({ needsApproval: true }), { entryPoint: true });

      graph.setEdge(START, { to: 'analyze' });
      graph.setEdge('analyze', { to: PAUSE });

      const result = await graph.execute('test');

      expect(result.status).toBe('paused');
      expect(result.pausedAt).toBe('analyze');
      expect(result.pauseData).toEqual({ needsApproval: true });
    });

    it('should conditionally pause based on output', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('check', async (ctx) => {
        return { risk: ctx.state.riskLevel };
      }, { entryPoint: true });
      graph.addVertex('proceed', async () => ({ done: true }));

      graph.setEdge(START, { to: 'check' });
      graph.setEdge('check', {
        to: (ctx) => {
          const last = JSON.parse(ctx.history.at(-1)!.output);
          return last.risk === 'high' ? PAUSE : 'proceed';
        },
        targets: [PAUSE, 'proceed'],
      });
      graph.setEdge('proceed', { to: END });

      // High risk - should pause
      const result1 = await graph.execute('test', { riskLevel: 'high' });
      expect(result1.status).toBe('paused');

      // Low risk - should complete
      const result2 = await graph.execute('test', { riskLevel: 'low' });
      expect(result2.status).toBe('completed');
    });

    it('should resume from paused state', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('review', async (ctx) => {
        if (!ctx.state.approval) {
          return { prompt: 'Please approve' };
        }
        return { approved: ctx.state.approval };
      }, { entryPoint: true });
      graph.addVertex('complete', async () => ({ done: true }));

      graph.setEdge(START, { to: 'review' });
      graph.setEdge('review', {
        to: (ctx) => ctx.state.approval ? 'complete' : PAUSE,
        targets: ['complete', PAUSE],
      });
      graph.setEdge('complete', { to: END });

      // First execution - pauses
      const result1 = await graph.execute('test');
      expect(result1.status).toBe('paused');
      expect(result1.pausedAt).toBe('review');

      // Resume with approval
      const result2 = await graph.resume(result1, { approval: true });
      expect(result2.status).toBe('completed');
      expect(result2.path).toContain('complete');
    });

    it('should merge additional state on resume', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('check', async (ctx) => {
        return {
          original: ctx.state.original,
          added: ctx.state.added
        };
      }, { entryPoint: true });

      graph.setEdge(START, { to: 'check' });
      graph.setEdge('check', {
        to: (ctx) => ctx.state.added ? END : PAUSE,
        targets: [END, PAUSE],
      });

      const result1 = await graph.execute('test', { original: 'value' });
      expect(result1.status).toBe('paused');

      const result2 = await graph.resume(result1, { added: 'newValue' });
      expect(result2.status).toBe('completed');
      expect(result2.context.state.original).toBe('value');
      expect(result2.context.state.added).toBe('newValue');
    });

    it('should throw error when resuming non-paused execution', async () => {
      const graph = new ExecutionGraph<string>();
      graph.addVertex('step', async () => 'done');
      graph.setEdge(START, { to: 'step' });
      graph.setEdge('step', { to: END });

      const result = await graph.execute('test');
      expect(result.status).toBe('completed');

      await expect(graph.resume(result)).rejects.toThrow(
        'Can only resume from a paused execution'
      );
    });

    it('should throw error when resuming from non-entry-point', async () => {
      const graph = new ExecutionGraph<string>();

      // Manually create a paused result with non-entry-point
      const fakeResult = {
        status: 'paused' as const,
        pausedAt: 'nonEntryPoint',
        context: { input: 'test', state: {}, history: [] },
        path: ['nonEntryPoint'],
      };

      graph.addVertex('nonEntryPoint', async () => 'done'); // NOT an entry point
      graph.setEdge(START, { to: 'nonEntryPoint' });
      graph.setEdge('nonEntryPoint', { to: END });

      await expect(graph.resume(fakeResult as any)).rejects.toThrow(
        "Cannot resume from 'nonEntryPoint': not an entry point"
      );
    });

    it('should preserve history across pause/resume', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('step1', async () => ({ step: 1 }));
      graph.addVertex('step2', async () => ({ step: 2 }), { entryPoint: true });
      graph.addVertex('step3', async () => ({ step: 3 }));

      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: 'step2' });
      graph.setEdge('step2', {
        to: (ctx) => ctx.state.continue ? 'step3' : PAUSE,
        targets: ['step3', PAUSE],
      });
      graph.setEdge('step3', { to: END });

      const result1 = await graph.execute('test');
      expect(result1.status).toBe('paused');
      expect(result1.context.history).toHaveLength(2);

      const result2 = await graph.resume(result1, { continue: true });
      expect(result2.status).toBe('completed');
      expect(result2.context.history).toHaveLength(4);
      expect(result2.context.history.map(h => h.node)).toEqual(['step1', 'step2', 'step2', 'step3']);
    });
  });

  describe('hooks', () => {
    it('should call beforeExecute hook', async () => {
      const graph = new ExecutionGraph<string>();
      const calls: string[] = [];

      graph.addVertex('step', async () => 'done');
      graph.setEdge(START, { to: 'step' });
      graph.setEdge('step', { to: END });

      graph.hook('beforeExecute', () => {
        calls.push('beforeExecute');
      });

      await graph.execute('test');

      expect(calls).toContain('beforeExecute');
    });

    it('should call afterExecute hook with status', async () => {
      const graph = new ExecutionGraph<string>();
      let capturedStatus: string | undefined;

      graph.addVertex('step', async () => 'done');
      graph.setEdge(START, { to: 'step' });
      graph.setEdge('step', { to: END });

      graph.hook('afterExecute', ({ status }) => {
        capturedStatus = status;
      });

      await graph.execute('test');

      expect(capturedStatus).toBe('completed');
    });

    it('should call beforeNode and afterNode hooks', async () => {
      const graph = new ExecutionGraph<string>();
      const calls: string[] = [];

      graph.addVertex('step1', async () => 'done1');
      graph.addVertex('step2', async () => 'done2');
      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: 'step2' });
      graph.setEdge('step2', { to: END });

      graph.hook('beforeNode', ({ node }) => {
        calls.push(`before:${node}`);
      });
      graph.hook('afterNode', ({ node }) => {
        calls.push(`after:${node}`);
      });

      await graph.execute('test');

      expect(calls).toEqual([
        'before:step1',
        'after:step1',
        'before:step2',
        'after:step2',
      ]);
    });

    it('should call beforeEdge hook', async () => {
      const graph = new ExecutionGraph<string>();
      const edges: Array<{ from: string | symbol; to: string | symbol }> = [];

      graph.addVertex('step1', async () => 'done');
      graph.addVertex('step2', async () => 'done');
      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: 'step2' });
      graph.setEdge('step2', { to: END });

      graph.hook('beforeEdge', ({ from, to }) => {
        edges.push({ from, to });
      });

      await graph.execute('test');

      expect(edges).toEqual([
        { from: 'step1', to: 'step2' },
        { from: 'step2', to: END },
      ]);
    });

    it('should call onError hook when node throws', async () => {
      const graph = new ExecutionGraph<string>();
      let capturedError: Error | undefined;
      let capturedNode: string | undefined;

      graph.addVertex('failing', async () => {
        throw new Error('Node failed');
      });
      graph.setEdge(START, { to: 'failing' });
      graph.setEdge('failing', { to: END });

      graph.hook('onError', ({ node, error }) => {
        capturedNode = node;
        capturedError = error;
      });

      await graph.execute('test');

      expect(capturedNode).toBe('failing');
      expect(capturedError?.message).toBe('Node failed');
    });

    it('should allow hook to abort execution', async () => {
      const graph = new ExecutionGraph<string>();

      graph.addVertex('step1', async () => 'done');
      graph.addVertex('step2', async () => 'done');
      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: 'step2' });
      graph.setEdge('step2', { to: END });

      graph.hook('beforeNode', ({ node }, control) => {
        if (node === 'step2') {
          control.abort(new Error('Aborted at step2'));
        }
      });

      const result = await graph.execute('test');

      expect(result.status).toBe('failed');
      expect(result.error?.message).toBe('Aborted at step2');
      expect(result.path).toEqual(['step1']);
    });

    it('should allow hook to skip node execution', async () => {
      const graph = new ExecutionGraph<string>();
      let step2Executed = false;

      graph.addVertex('step1', async () => ({ step: 1 }));
      graph.addVertex('step2', async () => {
        step2Executed = true;
        return { step: 2 };
      });
      graph.setEdge(START, { to: 'step1' });
      graph.setEdge('step1', { to: 'step2' });
      graph.setEdge('step2', { to: END });

      graph.hook('beforeNode', ({ node }, control) => {
        if (node === 'step2') {
          control.skip();
        }
      });

      const result = await graph.execute('test');

      expect(result.status).toBe('completed');
      expect(step2Executed).toBe(false);
    });

    it('should run multiple hooks in registration order', async () => {
      const graph = new ExecutionGraph<string>();
      const calls: number[] = [];

      graph.addVertex('step', async () => 'done');
      graph.setEdge(START, { to: 'step' });
      graph.setEdge('step', { to: END });

      graph.hook('beforeNode', () => calls.push(1));
      graph.hook('beforeNode', () => calls.push(2));
      graph.hook('beforeNode', () => calls.push(3));

      await graph.execute('test');

      expect(calls).toEqual([1, 2, 3]);
    });

    it('should stop running hooks after abort', async () => {
      const graph = new ExecutionGraph<string>();
      const calls: number[] = [];

      graph.addVertex('step', async () => 'done');
      graph.setEdge(START, { to: 'step' });
      graph.setEdge('step', { to: END });

      graph.hook('beforeNode', () => calls.push(1));
      graph.hook('beforeNode', (_, control) => {
        calls.push(2);
        control.abort(new Error('stop'));
      });
      graph.hook('beforeNode', () => calls.push(3)); // Should not run

      await graph.execute('test');

      expect(calls).toEqual([1, 2]);
    });
  });

  describe('static properties', () => {
    it('should expose START, END, and PAUSE symbols', () => {
      expect(ExecutionGraph.START).toBe(START);
      expect(ExecutionGraph.END).toBe(END);
      expect(ExecutionGraph.PAUSE).toBe(PAUSE);
    });
  });
});
