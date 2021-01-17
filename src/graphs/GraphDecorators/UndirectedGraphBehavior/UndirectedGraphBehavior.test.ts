import { DirectedEdge } from 'edges';
import { UndirectedGraphBehavior } from './UndirectedGraphBehavior';
import { DirectedGraph } from 'graphs';

describe.only('UndirectedGraphBehavior', () => {
  const xVertex = "x";
  const yVertex = "y";
  let graph: DirectedGraph<string>, decoratedGraph: UndirectedGraphBehavior<string, DirectedEdge, DirectedGraph<string>>;

	beforeEach(() => {
    graph = new DirectedGraph<string>();
    decoratedGraph = new UndirectedGraphBehavior<string, DirectedEdge, DirectedGraph<string>>(graph);
    // add verticies
    decoratedGraph.addVertex(xVertex);
    decoratedGraph.addVertex(yVertex);
  });

  describe('#addEdge', () => {
    it('should create an edge that connects both verticies to one another', () => {
      // verify edges do not exist
      expect(decoratedGraph.adjacent(xVertex, yVertex)).toBe(false);
      expect(decoratedGraph.adjacent(yVertex, xVertex)).toBe(false);
      // add edge
      decoratedGraph.addEdge(xVertex, yVertex);
      // verify edges
      expect(decoratedGraph.adjacent(xVertex, yVertex)).toBe(true);
      expect(decoratedGraph.adjacent(yVertex, xVertex)).toBe(true);
    });
  });

  describe('#removeEdge', () => {
    it('should remove an edge that connects both verticies to one another', () => {
      // add edge
      decoratedGraph.addEdge(xVertex, yVertex);
      // verify edges
      expect(decoratedGraph.adjacent(xVertex, yVertex)).toBe(true);
      expect(decoratedGraph.adjacent(yVertex, xVertex)).toBe(true);
      // remove edge
      decoratedGraph.removeEdge(xVertex, yVertex);
      // verify edges do not exist
      expect(decoratedGraph.adjacent(xVertex, yVertex)).toBe(false);
      expect(decoratedGraph.adjacent(yVertex, xVertex)).toBe(false);
    });
  });
});
