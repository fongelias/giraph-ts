import { DirectedEdge } from 'edges';
import { VertexKey } from 'verticies';

export class WeightedDirectedEdge<K extends VertexKey, W> extends DirectedEdge<K> {
  constructor(
    origin: K,
    destination: K,
    private weight: W
  ) {
    super(origin, destination);
  }

  public getWeight(): W {
    return this.weight;
  }
}