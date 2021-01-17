import { VertexKey } from 'verticies';
import { DirectedEdge } from 'edges';
import { GraphDecorator } from 'graphs/GraphDecorators';
import { AdjacencyList } from 'graphs';

export class UndirectedGraphBehavior<K extends VertexKey, E extends DirectedEdge<K>, G extends AdjacencyList<K, E>> extends GraphDecorator<K, E> {
  constructor(
    graph: G,
  ) {
    super(graph);
  }

  public addEdge(xVertex: K, yVertex: K): void {
    // adds an edge in both directions
    super.addEdge(xVertex, yVertex);
    super.addEdge(yVertex, xVertex);
  }

  public removeEdge(xVertex: K, yVertex: K): boolean {
    // removes an edge from both directions
    const edgeXRemoved = super.removeEdge(xVertex, yVertex);
    const edgeYRemoved = super.removeEdge(yVertex, xVertex);
    return edgeXRemoved || edgeYRemoved;
  }
}