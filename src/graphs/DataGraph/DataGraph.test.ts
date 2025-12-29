import { DataGraph } from './DataGraph';

describe('DataGraph', () => {
  describe('with no data (keys only)', () => {
    let graph: DataGraph<number>;

    beforeEach(() => {
      graph = new DataGraph<number>();
    });

    it('should add and check vertices', () => {
      expect(graph.addVertex(1)).toBe(true);
      expect(graph.hasVertex(1)).toBe(true);
      expect(graph.hasVertex(2)).toBe(false);
    });

    it('should return false when adding duplicate vertex', () => {
      graph.addVertex(1);
      expect(graph.addVertex(1)).toBe(false);
    });

    it('should add and check edges', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      expect(graph.addEdge(1, 2)).toBe(true);
      expect(graph.adjacent(1, 2)).toBe(true);
      expect(graph.adjacent(2, 1)).toBe(false);
    });

    it('should return false when adding duplicate edge', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      graph.addEdge(1, 2);
      expect(graph.addEdge(1, 2)).toBe(false);
    });

    it('should throw when adding edge with non-existent vertex', () => {
      graph.addVertex(1);
      expect(() => graph.addEdge(1, 2)).toThrow();
    });

    it('should remove vertices and connected edges', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      graph.addEdge(1, 2);

      graph.removeVertex(2);

      expect(graph.hasVertex(2)).toBe(false);
      expect(graph.neighbors(1)).toEqual([]);
    });

    it('should get neighbors', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      graph.addVertex(3);
      graph.addEdge(1, 2);
      graph.addEdge(1, 3);

      expect(graph.neighbors(1)).toEqual([2, 3]);
    });
  });

  describe('with vertex data only', () => {
    interface User {
      name: string;
    }

    let graph: DataGraph<number, User>;

    beforeEach(() => {
      graph = new DataGraph<number, User>();
    });

    it('should store and retrieve vertex data', () => {
      const alice = { name: 'Alice' };
      graph.addVertex(1, alice);
      expect(graph.getVertex(1)).toEqual(alice);
    });

    it('should return null for non-existent vertex', () => {
      expect(graph.getVertex(999)).toBeNull();
    });

    it('should return vertex data on removal', () => {
      const alice = { name: 'Alice' };
      graph.addVertex(1, alice);
      expect(graph.removeVertex(1)).toEqual(alice);
    });

    it('should return null when removing non-existent vertex', () => {
      expect(graph.removeVertex(999)).toBeNull();
    });

    it('should get neighbor data', () => {
      graph.addVertex(1, { name: 'Alice' });
      graph.addVertex(2, { name: 'Bob' });
      graph.addVertex(3, { name: 'Charlie' });
      graph.addEdge(1, 2);
      graph.addEdge(1, 3);

      expect(graph.neighborData(1)).toEqual([
        { name: 'Bob' },
        { name: 'Charlie' }
      ]);
    });
  });

  describe('with edge data only', () => {
    let graph: DataGraph<number, void, number>;

    beforeEach(() => {
      graph = new DataGraph<number, void, number>();
    });

    it('should store and retrieve edge data', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      graph.addEdge(1, 2, 100);

      expect(graph.getEdge(1, 2)).toBe(100);
    });

    it('should return null for non-existent edge', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      expect(graph.getEdge(1, 2)).toBeNull();
    });

    it('should return edge data on removal', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      graph.addEdge(1, 2, 100);

      expect(graph.removeEdge(1, 2)).toBe(100);
    });

    it('should return null when removing non-existent edge', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      expect(graph.removeEdge(1, 2)).toBeNull();
    });

    it('should get edges with data', () => {
      graph.addVertex(1);
      graph.addVertex(2);
      graph.addVertex(3);
      graph.addEdge(1, 2, 50);
      graph.addEdge(1, 3, 75);

      expect(graph.edgesFrom(1)).toEqual([
        { to: 2, data: 50 },
        { to: 3, data: 75 }
      ]);
    });
  });

  describe('with both vertex and edge data', () => {
    interface City {
      name: string;
      population: number;
    }

    interface Route {
      distance: number;
      toll: boolean;
    }

    let graph: DataGraph<string, City, Route>;

    beforeEach(() => {
      graph = new DataGraph<string, City, Route>();
    });

    it('should store both vertex and edge data', () => {
      const nyc: City = { name: 'New York', population: 8_000_000 };
      const la: City = { name: 'Los Angeles', population: 4_000_000 };
      const route: Route = { distance: 2800, toll: true };

      graph.addVertex('nyc', nyc);
      graph.addVertex('la', la);
      graph.addEdge('nyc', 'la', route);

      expect(graph.getVertex('nyc')).toEqual(nyc);
      expect(graph.getVertex('la')).toEqual(la);
      expect(graph.getEdge('nyc', 'la')).toEqual(route);
    });

    it('should work with complex queries', () => {
      graph.addVertex('nyc', { name: 'New York', population: 8_000_000 });
      graph.addVertex('la', { name: 'Los Angeles', population: 4_000_000 });
      graph.addVertex('chi', { name: 'Chicago', population: 2_700_000 });

      graph.addEdge('nyc', 'la', { distance: 2800, toll: true });
      graph.addEdge('nyc', 'chi', { distance: 790, toll: false });

      expect(graph.neighbors('nyc')).toEqual(['la', 'chi']);
      expect(graph.neighborData('nyc')).toEqual([
        { name: 'Los Angeles', population: 4_000_000 },
        { name: 'Chicago', population: 2_700_000 }
      ]);
      expect(graph.edgesFrom('nyc')).toEqual([
        { to: 'la', data: { distance: 2800, toll: true } },
        { to: 'chi', data: { distance: 790, toll: false } }
      ]);
    });

    it('should handle vertex removal correctly', () => {
      graph.addVertex('a', { name: 'A', population: 100 });
      graph.addVertex('b', { name: 'B', population: 200 });
      graph.addVertex('c', { name: 'C', population: 300 });

      graph.addEdge('a', 'b', { distance: 10, toll: false });
      graph.addEdge('b', 'c', { distance: 20, toll: true });
      graph.addEdge('a', 'c', { distance: 30, toll: false });

      // Remove b - should remove edges a->b and b->c
      const removed = graph.removeVertex('b');

      expect(removed).toEqual({ name: 'B', population: 200 });
      expect(graph.hasVertex('b')).toBe(false);
      expect(graph.neighbors('a')).toEqual(['c']);
      expect(() => graph.adjacent('a', 'b')).toThrow();
    });
  });

  describe('error handling', () => {
    let graph: DataGraph<number>;

    beforeEach(() => {
      graph = new DataGraph<number>();
    });

    it('should throw when checking adjacency with non-existent vertex', () => {
      graph.addVertex(1);
      expect(() => graph.adjacent(1, 2)).toThrow();
      expect(() => graph.adjacent(2, 1)).toThrow();
    });

    it('should throw when getting neighbors of non-existent vertex', () => {
      expect(() => graph.neighbors(1)).toThrow();
    });

    it('should throw when getting edges from non-existent vertex', () => {
      expect(() => graph.edgesFrom(1)).toThrow();
    });

    it('should throw when getting edge with non-existent vertex', () => {
      graph.addVertex(1);
      expect(() => graph.getEdge(1, 2)).toThrow();
    });

    it('should throw when removing edge with non-existent vertex', () => {
      graph.addVertex(1);
      expect(() => graph.removeEdge(1, 2)).toThrow();
    });
  });

  describe('#hasVerticies', () => {
    it('should return false for empty graph', () => {
      const graph = new DataGraph<number>();
      expect(graph.hasVerticies()).toBe(false);
    });

    it('should return true when graph has vertices', () => {
      const graph = new DataGraph<number>();
      graph.addVertex(1);
      expect(graph.hasVerticies()).toBe(true);
    });

    it('should return false after all vertices removed', () => {
      const graph = new DataGraph<number>();
      graph.addVertex(1);
      graph.removeVertex(1);
      expect(graph.hasVerticies()).toBe(false);
    });
  });
});
