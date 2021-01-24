import { DirectedEdge } from 'edges';
import { VertexKey, Vertex } from 'verticies';
import { notNull } from 'utilities';
// associates vertex keys with edges
// is always directed graph
// basic implementation is tested in DirectedGraph
export class AdjacencyList<K extends VertexKey, E extends DirectedEdge<K>> {
	private verticies: Record<K, Nullable<E[]>> = {} as Record<K, Nullable<E[]>>;
	private static emptyVertexValue = null;

	constructor() {}

	public hasVerticies(): boolean {
		return Object.values(this.verticies)
			.filter((val) => notNull(val as Nullable<E[]>))
			.length > 0;
	}

	public addEdge(edge: E): boolean {
		this.verifyVerticiesExist(edge.fromVertex(), edge.toVertex());
		// check if edge exists
		if (this.adjacent(edge.fromVertex(), edge.toVertex())) {
			return false;
		}
		// assumes directed edge
		this.getOrCreateEdgeArray(edge.fromVertex()).push(edge);
		return true;
	}

  public addVertex(vertexKey: K): boolean {
		if (this.hasVertex(vertexKey)) {
			return false;
		}

		this.verticies[vertexKey] = [];
		return true;
	}

	public hasVertex(vertexKey: K): boolean {
		const vertexNotRemoved = (vertexKey: K) => this.verticies[vertexKey] != AdjacencyList.emptyVertexValue;

		return vertexKey in this.verticies && vertexNotRemoved(vertexKey);
	}

	public removeVertex(vertexToRemove: K): boolean {
		if (!this.hasVertex(vertexToRemove)) {
			return false;
		}
		// modify all adjacencyLists to remove vertex
		const nonNullEdgeArrays: E[][]  = (Object.values(this.verticies) as Nullable<E[]>[]).filter(notNull);
		const allEdges: E[] = nonNullEdgeArrays.reduce((acc, edges) => [...acc, ...edges], []);

		allEdges.forEach((edge: E) => {
			if (edge.connects(vertexToRemove)) {
				this.removeEdge(edge.fromVertex(), edge.toVertex());
			}
		});
		// using null instead of delete for performance
		this.verticies[vertexToRemove] = AdjacencyList.emptyVertexValue;
		return true;
	}

	public removeEdge(fromVertex: K, toVertex: K): boolean {
		const newEdges = this.getOrCreateEdgeArray(fromVertex).filter(edge => !edge.connects(toVertex));
		const currLength = this.getOrCreateEdgeArray(fromVertex).length;
		this.verticies[fromVertex] = newEdges;

		return currLength > newEdges.length;
	}

	public adjacent(fromVertex: K, toVertex: K): boolean {
		this.verifyVerticiesExist(fromVertex, toVertex);

		for (const edge of this.getOrCreateEdgeArray(fromVertex)) {
			if (edge.connects(toVertex)) {
				return true;
			}
		}

		return false;
	}

	public neighbors(vertexKey: K): K[] {
		this.verifyVerticiesExist(vertexKey);

		return this.getOrCreateEdgeArray(vertexKey).map((edge: DirectedEdge<K>) => edge.toVertex());
	}

	private getOrCreateEdgeArray(vertexKey: K): E[] {
		return this.verticies[vertexKey] ?? [];
	}

	private verifyVerticiesExist(...vertexKeys: K[]): void {
		for (const vertexKey of vertexKeys) {
			if (!this.hasVertex(vertexKey as K)) {
				throw new Error(`vertex with key \'${vertexKey}\' does not exist`);
			}
		}
	}
}
