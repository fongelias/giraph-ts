import { VertexKey, Vertex } from 'verticies';

export class BasicVertex<K extends VertexKey, T> implements Vertex<K, T> {
  constructor(
    public name: K,
    public value: T,
  ) {}
}