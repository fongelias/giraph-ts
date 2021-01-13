import { VertexKey } from 'verticies';
import { Edge } from 'edges';

export class DirectedEdge<K extends VertexKey> implements Edge<K> {
	constructor(
		public fromVertex: K,
		public toVertex: K,
	) {}

	public connects(vertex: K): boolean {
		return vertex === this.fromVertex || vertex === this.toVertex;
	}
}