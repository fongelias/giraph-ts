import { AdjacencyList, WeightedDirectedEdgeBehavior } from "graphs";
import { WeightedDirectedEdge } from "edges";
import { VertexKey } from "verticies";

export class WeightedDirectedGraph<K extends VertexKey, W> implements WeightedDirectedEdgeBehavior<K, W> {
  private graph: AdjacencyList<K, WeightedDirectedEdge<K>> = new AdjacencyList<K, WeightedDirectedEdge<K>>();
  
  public addEdge(fromVertex: K, toVertex: K, weight: W): boolean {
    const newEdge = new WeightedDirectedEdge<K>(fromVertex, toVertex, weight);
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

  public edgesFrom(vertexKey: K): DirectedEdge<K>[] {
    return this.graph.edgesFrom(vertexKey);
  }
}
