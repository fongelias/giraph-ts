import { Edge } from 'edges';
import { VertexKey } from 'verticies';
import { notNull } from 'utilities';
// associates vertex keys with edges
// is always directed graph
// basic implementation is tested in DirectedGraph
export abstract class AdjacencyList<K extends VertexKey, E extends Edge<K>> {
	protected verticies: Record<K, Nullable<E[]>> = {} as Record<K, Nullable<E[]>>;
	private static emptyVertexValue = null;

	constructor(
		private edgeType: new (fromVertex: K, toVertex: K) => E,
	) {}

	public getEdgeType(): new (fromVertex: K, toVertex: K) => E {
		return this.edgeType;
	}

	public addVertex(vertexToAdd: K): void {
		if (this.hasVertex(vertexToAdd)) {
			throw new Error("cannot add an existing vertex");
		}
		this.verticies[vertexToAdd] = [];
	}

	public hasVertex(vertex: K): boolean {
		const vertexNotRemoved = (vertex: K) => this.verticies[vertex] != AdjacencyList.emptyVertexValue;

		return vertex in this.verticies && vertexNotRemoved(vertex);
	}

	public removeVertex(vertexToRemove: K): boolean {
		if (!this.verticies[vertexToRemove]) {
			return false;
		}
		// modify all adjacencyLists to remove vertex
		const nonNullEdgeArrays: E[][]  = (Object.values(this.verticies) as Nullable<E[]>[]).filter(notNull);
		const allEdges: E[] = nonNullEdgeArrays.reduce((acc, edges) => [...acc, ...edges], []);

		allEdges.forEach((edge: E) => {
			if (edge.connects(vertexToRemove)) {
				this.removeEdge(edge.fromVertex, edge.toVertex);
			}
		});
		// using null instead of delete for performance
		this.verticies[vertexToRemove] = AdjacencyList.emptyVertexValue;
		return true;
	}

	public addEdge(fromVertex: K, toVertex: K): void {
		if (!this.hasVertex(fromVertex) || !this.hasVertex(toVertex)) {
			throw new Error('cannot create edge between one or more non-existing verticies');
		}
		// edge should always have direction
		const edge: E = new this.edgeType(fromVertex, toVertex);
		this.getOrCreateEdgeArray(fromVertex).push(edge);
	}

	public removeEdge(fromVertex: K, toVertex: K): boolean {
		if (!this.hasVertex(fromVertex) || !this.hasVertex(toVertex)) {
			throw new Error('cannot create edge between one or more non-existing verticies');
		}

		const newEdges = this.getOrCreateEdgeArray(fromVertex).filter(edge => !edge.connects(toVertex));
		const currLength = this.getOrCreateEdgeArray(fromVertex).length;
		this.verticies[fromVertex] = newEdges;

		return currLength > newEdges.length;
	}

	public adjacent(fromVertex: K, toVertex: K): boolean {
		for (const edge of this.getOrCreateEdgeArray(fromVertex)) {
			if (edge.connects(toVertex)) {
				return true;
			}
		}

		return false;
	}

	public neighbors(vertex: K): K[] | null {
		if (!this.hasVertex(vertex)) {
			return AdjacencyList.emptyVertexValue;
		}

		return this.getOrCreateEdgeArray(vertex).map((edge) => edge.toVertex);
	}

	private getOrCreateEdgeArray(vertex: K): E[] {
		if (!this.verticies[vertex]) {
			this.verticies[vertex] = [];
		}

		return this.verticies[vertex]!;
	}
}
