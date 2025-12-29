import { BaseGraph } from "graphs";
import { VertexKey } from "verticies";

/**
 * A wrapper that adds object storage to any graph implementing BaseGraph.
 *
 * @typeParam K - The vertex key type (string or number)
 * @typeParam V - The vertex value/object type
 * @typeParam E - The edge type used by the underlying graph
 * @typeParam G - The underlying graph type
 */
export class ObjectGraph<K extends VertexKey, V, E, G extends BaseGraph<K, E>> {
  private graph: G;
  private objects: Map<K, V> = new Map();

  constructor(graph: G) {
    this.graph = graph;
  }

  /**
   * Adds a vertex with an associated object value.
   * @returns false if the vertex already exists, true otherwise
   */
  public addVertex(key: K, value: V): boolean {
    const added = this.graph.addVertex(key);
    if (added) {
      this.objects.set(key, value);
    }
    return added;
  }

  /**
   * Retrieves the object associated with a vertex.
   * @returns the object or null if the vertex doesn't exist
   */
  public getVertex(key: K): V | null {
    return this.objects.get(key) ?? null;
  }

  /**
   * Removes a vertex and returns its associated object.
   * @returns the removed object or null if the vertex didn't exist
   */
  public removeVertex(key: K): V | null {
    const value = this.objects.get(key) ?? null;
    const removed = this.graph.removeVertex(key);
    if (removed) {
      this.objects.delete(key);
    }
    return removed ? value : null;
  }

  /**
   * Returns the objects associated with all neighboring vertices.
   * @throws Error if the vertex doesn't exist
   */
  public neighborObjects(key: K): V[] {
    const neighborKeys = this.graph.neighbors(key);
    return neighborKeys
      .map(k => this.objects.get(k))
      .filter((v): v is V => v !== undefined);
  }

  /**
   * Returns the underlying graph for edge operations.
   * Use this to call addEdge, removeEdge, etc.
   */
  public getGraph(): G {
    return this.graph;
  }

  // Delegated methods from BaseGraph

  public hasVerticies(): boolean {
    return this.graph.hasVerticies();
  }

  public hasVertex(key: K): boolean {
    return this.graph.hasVertex(key);
  }

  public adjacent(fromVertex: K, toVertex: K): boolean {
    return this.graph.adjacent(fromVertex, toVertex);
  }

  public neighbors(key: K): K[] {
    return this.graph.neighbors(key);
  }

  public edgesFrom(key: K): E[] {
    return this.graph.edgesFrom(key);
  }
}
