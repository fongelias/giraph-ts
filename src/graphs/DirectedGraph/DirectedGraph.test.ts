import { DirectedGraph } from './DirectedGraph';

// This tests abstract class AdjacencyList
describe('DirectedGraph', () => {
	const vertex = "test vertex";
	let graph: DirectedGraph<string>;

	beforeEach(() => {
		graph = new DirectedGraph<string>();
	});

	describe('#addVertex', () => {
		it('should add a vertex', () => {
			graph.addVertex(vertex);
			expect(graph.hasVertex(vertex)).toBe(true);
		});

		it('should throw an error if the vertex already exists', () => {
			graph.addVertex(vertex);
			expect(() => graph.addVertex(vertex)).toThrow();
		})
	});

	describe('#hasVertex', () => {
		it('should return false if there is no matching vertex in the graph', () => {
			expect(graph.hasVertex("someVertex")).toBe(false);
		});

		it('should return true if there is a matching vertex in the graph', () => {
			// check for false positive
			expect(graph.hasVertex(vertex)).toBe(false);
			// add vertex and test
			graph.addVertex(vertex);
			expect(graph.hasVertex(vertex)).toBe(true);
		});
	});

	describe('#removeVertex', () => {
		it('should remove an existing vertex', () => {
			// add and check for existing vertex
			graph.addVertex(vertex);
			expect(graph.hasVertex(vertex)).toBe(true);
			// remove vertex and test
			graph.removeVertex(vertex);
			expect(graph.hasVertex(vertex)).toBe(false);
		});

		it('should remove all edges associated with the vertex', () => {
			// add verticies
			const fromVertex = "start";
			const toVertex = "end"
			graph.addVertex(fromVertex);
			graph.addVertex(toVertex);
			expect(graph.hasVertex(fromVertex)).toBe(true);
			expect(graph.hasVertex(toVertex)).toBe(true);
			// add edges in both directions
			graph.addEdge(fromVertex, toVertex);
			graph.addEdge(toVertex, fromVertex);
			expect(graph.neighbors(fromVertex)).toEqual([toVertex]);
			expect(graph.neighbors(toVertex)).toEqual([fromVertex]);
			// remove vertex and test for edges
			graph.removeVertex(fromVertex);
			expect(graph.neighbors(fromVertex)).toEqual(null);
			expect(graph.neighbors(toVertex)).toEqual([]);
		});
	});

	describe('#addEdge', () => {
		it('should add an edge', () => {
			// add verticies
			const fromVertex = "start";
			const toVertex = "end"
			graph.addVertex(fromVertex);
			graph.addVertex(toVertex);
			// verify there are no existing edges
			expect(graph.neighbors(fromVertex)).toEqual([]);
			// add an edge
			graph.addEdge(fromVertex, toVertex);
			// verify that the edge exists
			expect(graph.neighbors(fromVertex)).toEqual([toVertex]);
		});

		it('should throw an error if one or more of the verticies do not exist', () => {
			const fromVertex = "start";
			const toVertex = "end"
			// verify vertex does not exist
			expect(graph.hasVertex(fromVertex)).toBe(false);
			expect(graph.hasVertex(toVertex)).toBe(false);
			// attempt to add edge
			expect(() => graph.addEdge(fromVertex, toVertex)).toThrow();
			// add one of the verticies
			graph.addVertex(fromVertex);
			// attempt to add edge
			expect(() => graph.addEdge(fromVertex, toVertex)).toThrow();
		});
	});

	describe('#removeEdge', () => {
		const fromVertex = "start";
		const toVertex = "end";

		beforeEach(() => {
			// add verticies
			graph.addVertex(fromVertex);
			graph.addVertex(toVertex);
			// add edge
			graph.addEdge(fromVertex, toVertex);
			// verify that the edge exists
			expect(graph.neighbors(fromVertex)).toEqual([toVertex]);
		});

		it('should remove an edge', () => {
			// remove edge and verify removal
			graph.removeEdge(fromVertex, toVertex);
			expect(graph.neighbors(fromVertex)).toEqual([]);
		});

		it('should return true when the edge is removed', () => {
			expect(graph.removeEdge(fromVertex, toVertex)).toBe(true);
		});

		it('should throw an error if one or more of the verticies do not exist', () => {
			const secondVertex = "some other vertex";
			const thirdVertex = "one more vertex"
			// verify vertex does not exist
			expect(graph.hasVertex(secondVertex)).toBe(false);
			expect(graph.hasVertex(thirdVertex)).toBe(false);
			// attempt to remove edge between two non-existing verticies
			expect(() => graph.removeEdge(secondVertex, thirdVertex)).toThrow();
			// attempt to add edge between an existing and non-existing vertex
			expect(() => graph.removeEdge(fromVertex, secondVertex)).toThrow();
		});
	});

	describe('#adjacent', () => {
		const fromVertex = "start";
		const toVertex = "end";

		beforeEach(() => {
			// add verticies
			graph.addVertex(fromVertex);
			graph.addVertex(toVertex);
		})

		it('should return true if there is an edge pointing from fromVertex to toVertex', () => {
			graph.addEdge(fromVertex, toVertex);
			expect(graph.adjacent(fromVertex, toVertex)).toBe(true);
		});

		it('should return false if there is not an edge pointing from fromVertex to toVertex', () => {
			expect(graph.adjacent(fromVertex, toVertex)).toBe(false);
		});
	});

	describe('#neighbors', () => {
		it('should return all verticies connected by an edge', () => {
			// add verticies
			const fromVertex = "start";
			const toVertex = "end"
			const anotherDestination = "another end"
			graph.addVertex(fromVertex);
			graph.addVertex(toVertex);
			graph.addVertex(anotherDestination);
			// verify that there are no existing edges
			expect(graph.neighbors(fromVertex)).toEqual([]);
			// add edges
			graph.addEdge(fromVertex, toVertex);
			graph.addEdge(fromVertex, anotherDestination);
			// verify that all verticies are returned
			expect(graph.neighbors(fromVertex)).toEqual([toVertex, anotherDestination]);
		});
	});
});
