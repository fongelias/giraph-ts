import { AdjacencyList, UndirectedEdgeBehavior } from "graphs";
import { DirectedEdge } from "edges";
import { VertexKey } from "verticies";

export class UndirectedGraph<K extends VertexKey> implements UndirectedEdgeBehavior<K> {
  private graph: AdjacencyList<K, DirectedEdge<K>> = new AdjacencyList<K, DirectedEdge<K>>();
  
  public addEdge(xVertex: K, yVertex: K): boolean {
    const edgeXToY = new DirectedEdge<K>(xVertex, yVertex);
    const edgeYToX = new DirectedEdge<K>(yVertex, xVertex);
    return this.graph.addEdge(edgeXToY) && this.graph.addEdge(edgeYToX);
  }

  public removeEdge(xVertex: K, yVertex: K): boolean {
    return this.graph.removeEdge(xVertex, yVertex) && this.graph.removeEdge(yVertex, xVertex);
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

  public adjacent(fromVertex: K, toVertex: K): boolean {
    return this.graph.adjacent(fromVertex, toVertex);
  }

  public neighbors(vertexKey: K): K[] {
    return this.graph.neighbors(vertexKey);
  }

  public edgesFrom(vertexKey: K): DirectedEdge<K>[] {
    return this.graph.edgesFrom(vertexKey);
  }
}
