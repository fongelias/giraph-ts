import { WeightedDirectedGraph } from './WeightedDirectedGraph';
import { WeightedDirectedEdge } from 'edges';

describe('WeightedDirectedGraph', () => {
  const defaultVertex = "some vertex key";
  let graph: WeightedDirectedGraph<string, number>;

  beforeEach(() => {
    graph = new WeightedDirectedGraph<string, number>();
  });

  describe('#addEdge', () => {
    const destinationVertex = "some destination";

    beforeEach(() => {
      graph.addVertex(defaultVertex);
      graph.addVertex(destinationVertex);
    });

    it('should add an edge between two verticies', () => {
      // verify edges does not exist
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(false);
      // create and add edge
      graph.addEdge(defaultVertex, destinationVertex);
      // verify edge exists
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(true);
    });

    it('should return true when an edge is added', () => {
      // verify edges does not exist
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(false);
      // create and add edge
      expect(graph.addEdge(defaultVertex, destinationVertex)).toBe(true);
      // verify edge exists
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(true);
    });

    it('should return false when the edge already exists', () => {
      // add edge
      expect(graph.addEdge(defaultVertex, destinationVertex)).toBe(true);
      // verify edge exists
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(true);
      // try to add the same edge
      expect(graph.addEdge(defaultVertex, destinationVertex)).toBe(false);
    });

    it('should store the weight of the edge', () => {
      const expectedWeight = 5;
      // add edge
      expect(graph.addEdge(defaultVertex, destinationVertex, expectedWeight)).toBe(true);
      // retrieve edge and verify weight
      const addedEdge = graph.edgesFrom(defaultVertex)[0];
      expect(addedEdge.getWeight()).toBe(expectedWeight);
    });

    it('should add throw an error when one or more of the verticies do not exist', () => {
      const nonExistentVertex = "this vertex is not on the graph";
      // attempt to add faulty edge
      expect(() => graph.addEdge(defaultVertex, nonExistentVertex)).toThrow();
    });
  });

  describe('#hasVerticies', () => {
    it('should return true if AdjacencyList contains verticies', () => {
      // verify empty
      expect(graph.hasVerticies()).toBe(false);
      // add verticies
      graph.addVertex(defaultVertex);
      // verify verticies added
      expect(graph.hasVerticies()).toBe(true);
    });

    it('should return false if the graph does not have verticies', () => {
      expect(graph.hasVerticies()).toBe(false);
    });
  });

  describe('#addVertex', () => {
    it('should add a vertex', () => {
      // verify vertex does not exist
      expect(graph.hasVertex(defaultVertex)).toBe(false);
      // add vertex
      graph.addVertex(defaultVertex);
      // verify that it exists
      expect(graph.hasVertex(defaultVertex)).toBe(true);
    });

    it('should return false if the vertex already exists', () => {
      // verify vertex does not exist
      expect(graph.hasVertex(defaultVertex)).toBe(false);
      // add vertex
      graph.addVertex(defaultVertex);
      // re-add vertex
      expect(graph.addVertex(defaultVertex)).toBe(false);
    });

    it('should return true if the vertex is added successfully', () => {
      // verify vertex does not exist
      expect(graph.hasVertex(defaultVertex)).toBe(false);
      // add vertex
      expect(graph.addVertex(defaultVertex)).toBe(true);
      // verify that it exists
      expect(graph.hasVertex(defaultVertex)).toBe(true);
    });
  });

  describe('#hasVertex', () => {
    it('should return true if the graph contains the vertex', () => {
      // verify that graph does not contain the vertex
      expect(graph.hasVertex(defaultVertex)).toBe(false);
      // add the vertex
      graph.addVertex(defaultVertex);
      // verify its existence
      expect(graph.hasVertex(defaultVertex)).toBe(true);
    });

    it('should return false if the graph does not contain the vertex', () => {
      expect(graph.hasVertex(defaultVertex)).toBe(false);
    });
  });

  describe('#removeVertex', () => {
    it('should remove a vertex', () => {
      // add the vertex
      graph.addVertex(defaultVertex);
      // verify its existence
      expect(graph.hasVertex(defaultVertex)).toBe(true);
      // remove the vertex
      graph.removeVertex(defaultVertex);
      // verify that it no longer exists
      expect(graph.hasVertex(defaultVertex)).toBe(false);
    });

    it('should return true if the vertex is removed', () => {
      // add the vertex
      graph.addVertex(defaultVertex);
      // verify its existence
      expect(graph.hasVertex(defaultVertex)).toBe(true);
      // remove the vertex
      expect(graph.removeVertex(defaultVertex)).toBe(true);
      // verify that it no longer exists
      expect(graph.hasVertex(defaultVertex)).toBe(false);
    });

    it('should return false if the vertex does not exist', () => {
      // verify vertex does not exist
      expect(graph.hasVertex(defaultVertex)).toBe(false);
      // attemot to remove the vertex
      expect(graph.removeVertex(defaultVertex)).toBe(false);
    });
  });

  describe('#removeEdge', () => {
    const destinationVertex = "some destination";

    beforeEach(() => {
      graph.addVertex(defaultVertex);
      graph.addVertex(destinationVertex);
    });

    it('should remove an edge between two verticies', () => {
      // create and add edge
      graph.addEdge(defaultVertex, destinationVertex);
      // verify edge exists
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(true);
      // remove edge
      graph.removeEdge(defaultVertex, destinationVertex);
      // verify edges does not exist
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(false);
    });

    it('should return true if an edge is removed', () => {
      // create and add edge
      graph.addEdge(defaultVertex, destinationVertex);
      // verify edge exists
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(true);
      // remove edge
      expect(graph.removeEdge(defaultVertex, destinationVertex)).toBe(true);
      // verify edges does not exist
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(false);
    });

    it('should return false if the edge does not exist', () => {
      // verify edge does not exist
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(false);
      // remove edge
      expect(graph.removeEdge(defaultVertex, destinationVertex)).toBe(false);
    });
  });

  describe('#adjacent', () => {
    const destinationVertex = "some destination";

    it('should return true if there is an edge connecting one vertex to the other', () => {
       // add verticies
       graph.addVertex(defaultVertex);
       graph.addVertex(destinationVertex);
      // verify non-adjacency
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(false);
      // add edge
      graph.addEdge(defaultVertex, destinationVertex);
      // verify adjacency
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(true);
    });

    it('should return false if there is no edge connecting one vertex to the other', () => {
      // add verticies
      graph.addVertex(defaultVertex);
      graph.addVertex(destinationVertex);
      // verify non-adjacency
      expect(graph.adjacent(defaultVertex, destinationVertex)).toBe(false);
    });

    it('should throw an error if one or more of the verticies do not exist', () => {
      const nonExistentVertex = "this vertex is not on the graph";
      expect(() => graph.adjacent(defaultVertex, nonExistentVertex)).toThrow();
      expect(() => graph.adjacent(nonExistentVertex, defaultVertex)).toThrow();
      expect(() => graph.adjacent(nonExistentVertex, nonExistentVertex)).toThrow();
    });
  });

  describe('#neighbors', () => {
    it('should return an array of neighbors from the vertex', () => {
      // create and add verticies
      const firstDestination = "some destination";
      const secondDestination = "another destination";
      graph.addVertex(defaultVertex);
      graph.addVertex(firstDestination);
      graph.addVertex(secondDestination);
      // add edges
      graph.addEdge(defaultVertex, firstDestination);
      graph.addEdge(defaultVertex, secondDestination);
      // verify neighbors
      expect(graph.neighbors(defaultVertex)).toEqual([firstDestination, secondDestination]);
    });

    it('should throw an error if the vertex does not exist', () => {
      const nonExistentVertex = "this vertex is not on the graph";
      expect(() => graph.neighbors(nonExistentVertex)).toThrow();
    });
  });

  describe('#edgesFrom', () => {
    it('should return an array of edges from the vertex', () => {
      // create and add verticies
      const firstDestination = "some destination";
      const secondDestination = "another destination";
      graph.addVertex(defaultVertex);
      graph.addVertex(firstDestination);
      graph.addVertex(secondDestination);
      // add edges
      graph.addEdge(defaultVertex, firstDestination);
      graph.addEdge(defaultVertex, secondDestination);
      // verify edges
      const firstExpectedEdge = new WeightedDirectedEdge<string, number>(defaultVertex, firstDestination);
      const secondExpectedEdge = new WeightedDirectedEdge<string, number>(defaultVertex, secondDestination);
      expect(graph.edgesFrom(defaultVertex)).toEqual([firstExpectedEdge, secondExpectedEdge]);
    });

    it('should throw an error if the vertex does not exist', () => {
      const nonExistentVertex = "this vertex is not on the graph";
      expect(() => graph.edgesFrom(nonExistentVertex)).toThrow();
    });
  });
});
