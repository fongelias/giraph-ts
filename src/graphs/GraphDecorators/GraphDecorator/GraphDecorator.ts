import { VertexKey } from 'verticies';
import { Edge } from 'edges';
import { AdjacencyList } from 'graphs';

export abstract class GraphDecorator<K extends VertexKey, E extends Edge<K>> extends AdjacencyList<K, E> {
  constructor(
    protected graph: AdjacencyList<K, E>,
  ) {
    super(graph.getEdgeType());
  }
}