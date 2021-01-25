import { AdjacencyList, WeightedUndirectedEdgeBehavior } from "graphs";
import { WeightedDirectedEdge } from "edges";
import { VertexKey } from "verticies";

export class WeightedUndirectedGraph<K extends VertexKey, W> implements WeightedUndirectedEdgeBehavior<K, W> {
  private graph: AdjacencyList<K, WeightedDirectedEdge<K, W>> = new AdjacencyList<K, WeightedDirectedEdge<K, W>>();
  
  public addEdge(xVertex: K, yVertex: K, weight: W): boolean {
    const edgeXToY = new WeightedDirectedEdge<K, W>(xVertex, yVertex, weight);
    const edgeYToX = new WeightedDirectedEdge<K, W>(yVertex, xVertex, weight);
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

  public edgesFrom(vertexKey: K): WeightedDirectedEdge<K, W>[] {
    return this.graph.edgesFrom(vertexKey);
  }
}
