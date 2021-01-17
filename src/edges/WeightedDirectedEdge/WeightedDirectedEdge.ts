import { DirectedEdge } from 'edges';
import { VertexKey } from 'verticies';

export class WeightedDirectedEdge<K extends VertexKey, T> extends DirectedEdge<K> {
  constructor(
    fromVertex: K,
    toVertex: K,
    private weight: T,
  ) {
    super(fromVertex, toVertex);
  }

  public getWeight(): T {
    return this.weight;
  }
}