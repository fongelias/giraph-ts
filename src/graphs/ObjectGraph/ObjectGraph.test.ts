import { ObjectGraph } from './ObjectGraph';
import { DirectedGraph } from 'graphs/DirectedGraph';
import { UndirectedGraph } from 'graphs/UndirectedGraph';
import { WeightedDirectedGraph } from 'graphs/WeightedDirectedGraph';

interface User {
  id: number;
  name: string;
}

describe('ObjectGraph', () => {
  describe('with DirectedGraph', () => {
    let graph: ObjectGraph<number, User, unknown, DirectedGraph<number>>;

    beforeEach(() => {
      graph = new ObjectGraph(new DirectedGraph<number>());
    });

    describe('#addVertex', () => {
      it('should add a vertex with an associated object', () => {
        const user: User = { id: 1, name: 'Alice' };
        expect(graph.addVertex(1, user)).toBe(true);
        expect(graph.hasVertex(1)).toBe(true);
        expect(graph.getVertex(1)).toEqual(user);
      });

      it('should return false if the vertex already exists', () => {
        const user1: User = { id: 1, name: 'Alice' };
        const user2: User = { id: 1, name: 'Bob' };
        expect(graph.addVertex(1, user1)).toBe(true);
        expect(graph.addVertex(1, user2)).toBe(false);
        // Original object should be preserved
        expect(graph.getVertex(1)).toEqual(user1);
      });
    });

    describe('#getVertex', () => {
      it('should return the object associated with a vertex', () => {
        const user: User = { id: 1, name: 'Alice' };
        graph.addVertex(1, user);
        expect(graph.getVertex(1)).toEqual(user);
      });

      it('should return null if the vertex does not exist', () => {
        expect(graph.getVertex(999)).toBeNull();
      });
    });

    describe('#removeVertex', () => {
      it('should remove a vertex and return its object', () => {
        const user: User = { id: 1, name: 'Alice' };
        graph.addVertex(1, user);
        expect(graph.removeVertex(1)).toEqual(user);
        expect(graph.hasVertex(1)).toBe(false);
        expect(graph.getVertex(1)).toBeNull();
      });

      it('should return null if the vertex does not exist', () => {
        expect(graph.removeVertex(999)).toBeNull();
      });

      it('should remove edges connected to the vertex', () => {
        const alice: User = { id: 1, name: 'Alice' };
        const bob: User = { id: 2, name: 'Bob' };
        graph.addVertex(1, alice);
        graph.addVertex(2, bob);
        graph.getGraph().addEdge(1, 2);

        expect(graph.adjacent(1, 2)).toBe(true);
        graph.removeVertex(2);
        expect(graph.hasVertex(2)).toBe(false);
      });
    });

    describe('#neighborObjects', () => {
      it('should return objects for all neighboring vertices', () => {
        const alice: User = { id: 1, name: 'Alice' };
        const bob: User = { id: 2, name: 'Bob' };
        const charlie: User = { id: 3, name: 'Charlie' };

        graph.addVertex(1, alice);
        graph.addVertex(2, bob);
        graph.addVertex(3, charlie);

        graph.getGraph().addEdge(1, 2);
        graph.getGraph().addEdge(1, 3);

        const neighbors = graph.neighborObjects(1);
        expect(neighbors).toEqual([bob, charlie]);
      });

      it('should return an empty array if vertex has no neighbors', () => {
        const alice: User = { id: 1, name: 'Alice' };
        graph.addVertex(1, alice);
        expect(graph.neighborObjects(1)).toEqual([]);
      });

      it('should throw an error if the vertex does not exist', () => {
        expect(() => graph.neighborObjects(999)).toThrow();
      });
    });

    describe('#hasVerticies', () => {
      it('should return true if the graph has vertices', () => {
        expect(graph.hasVerticies()).toBe(false);
        graph.addVertex(1, { id: 1, name: 'Alice' });
        expect(graph.hasVerticies()).toBe(true);
      });
    });

    describe('#adjacent', () => {
      it('should delegate to the underlying graph', () => {
        const alice: User = { id: 1, name: 'Alice' };
        const bob: User = { id: 2, name: 'Bob' };
        graph.addVertex(1, alice);
        graph.addVertex(2, bob);

        expect(graph.adjacent(1, 2)).toBe(false);
        graph.getGraph().addEdge(1, 2);
        expect(graph.adjacent(1, 2)).toBe(true);
      });
    });

    describe('#neighbors', () => {
      it('should return keys of neighboring vertices', () => {
        graph.addVertex(1, { id: 1, name: 'Alice' });
        graph.addVertex(2, { id: 2, name: 'Bob' });
        graph.addVertex(3, { id: 3, name: 'Charlie' });

        graph.getGraph().addEdge(1, 2);
        graph.getGraph().addEdge(1, 3);

        expect(graph.neighbors(1)).toEqual([2, 3]);
      });
    });

    describe('#getGraph', () => {
      it('should return the underlying graph for edge operations', () => {
        graph.addVertex(1, { id: 1, name: 'Alice' });
        graph.addVertex(2, { id: 2, name: 'Bob' });

        const underlyingGraph = graph.getGraph();
        expect(underlyingGraph.addEdge(1, 2)).toBe(true);
        expect(graph.adjacent(1, 2)).toBe(true);
      });
    });
  });

  describe('with UndirectedGraph', () => {
    let graph: ObjectGraph<string, User, unknown, UndirectedGraph<string>>;

    beforeEach(() => {
      graph = new ObjectGraph(new UndirectedGraph<string>());
    });

    it('should work with string keys', () => {
      const alice: User = { id: 1, name: 'Alice' };
      graph.addVertex('alice', alice);
      expect(graph.getVertex('alice')).toEqual(alice);
    });

    it('should handle bidirectional edges', () => {
      const alice: User = { id: 1, name: 'Alice' };
      const bob: User = { id: 2, name: 'Bob' };

      graph.addVertex('alice', alice);
      graph.addVertex('bob', bob);
      graph.getGraph().addEdge('alice', 'bob');

      // Both directions should work for undirected graph
      expect(graph.adjacent('alice', 'bob')).toBe(true);
      expect(graph.adjacent('bob', 'alice')).toBe(true);
      expect(graph.neighborObjects('alice')).toEqual([bob]);
      expect(graph.neighborObjects('bob')).toEqual([alice]);
    });
  });

  describe('with WeightedDirectedGraph', () => {
    interface City {
      name: string;
      population: number;
    }

    let graph: ObjectGraph<string, City, unknown, WeightedDirectedGraph<string, number>>;

    beforeEach(() => {
      graph = new ObjectGraph(new WeightedDirectedGraph<string, number>());
    });

    it('should work with weighted edges', () => {
      const nyc: City = { name: 'New York', population: 8_000_000 };
      const la: City = { name: 'Los Angeles', population: 4_000_000 };

      graph.addVertex('nyc', nyc);
      graph.addVertex('la', la);

      // Add weighted edge (distance in miles)
      graph.getGraph().addEdge('nyc', 'la', 2800);

      expect(graph.adjacent('nyc', 'la')).toBe(true);
      expect(graph.neighborObjects('nyc')).toEqual([la]);

      // Verify weight through underlying graph
      const edges = graph.edgesFrom('nyc');
      expect(edges[0].getWeight()).toBe(2800);
    });
  });
});
