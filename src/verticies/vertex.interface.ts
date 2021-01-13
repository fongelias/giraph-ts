export type VertexKey = alphaNumeric;

export interface Vertex<K extends VertexKey, T> {
	name: K;
	value: T;
}
