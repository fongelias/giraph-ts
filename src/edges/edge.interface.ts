import { VertexKey } from 'verticies';

export interface Edge<K extends VertexKey> {
	fromVertex: K;
	toVertex: K;
	connects: (vertex: K) => boolean;
}
