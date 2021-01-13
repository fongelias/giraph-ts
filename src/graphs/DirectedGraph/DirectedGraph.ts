import { VertexKey } from 'verticies';
import { AdjacencyList } from 'graphs';
import { DirectedEdge } from 'edges';

export class DirectedGraph<K extends VertexKey> extends AdjacencyList<K, DirectedEdge<K>> {
  constructor() {
    super(DirectedEdge);
  }
}
