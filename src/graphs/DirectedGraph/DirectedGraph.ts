import { AdjacencyList, DirectedEdgeBehavior } from "graphs";
import { DirectedEdge } from "edges";
import { VertexKey } from "verticies";

export class DirectedGraph<K extends VertexKey> implements DirectedEdgeBehavior<K> {
  private graph: AdjacencyList<K, DirectedEdge<K>> = new AdjacencyList<K, DirectedEdge<K>>();
  
  public addEdge(fromVertex: K, toVertex: K): boolean {
    const newEdge = new DirectedEdge<K>(fromVertex, toVertex);
    return this.graph.addEdge(newEdge);
  }

  // Delegated functions

  public hasVerticies(): boolean {
    return this.graph.hasVerticies();
  }

  public addVertex(vertexKey: K): boolean {
    return this.graph.addVertex(vertexKey);
  }

  public hasVertex(vertexKey: K): boolean {
    return this.graph.hasVertex(vertexKey);
  }

  public removeVertex(vertexToRemove: K): boolean {
    return this.graph.removeVertex(vertexToRemove);
  }

  public removeEdge(fromVertex: K, toVertex: K): boolean {
    return this.graph.removeEdge(fromVertex, toVertex);
  }

  public adjacent(fromVertex: K, toVertex: K): boolean {
    return this.graph.adjacent(fromVertex, toVertex);
  }

  public neighbors(vertexKey: K): K[] {
    return this.graph.neighbors(vertexKey);
  }
}
