export type VertexKey = alphaNumeric;

export interface Vertex<K extends VertexKey> {
	name: K;
}
