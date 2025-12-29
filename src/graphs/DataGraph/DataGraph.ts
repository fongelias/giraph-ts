import { VertexKey } from "verticies";

interface EdgeEntry<K extends VertexKey, E> {
  to: K;
  data: E;
}

/**
 * A directed graph with optional data storage on vertices and edges.
 *
 * @typeParam K - The vertex key type (string or number)
 * @typeParam V - The vertex data type (default: void)
 * @typeParam E - The edge data type (default: void)
 */
export class DataGraph<K extends VertexKey, V = void, E = void> {
  private vertices: Map<K, V> = new Map();
  private edges: Map<K, EdgeEntry<K, E>[]> = new Map();

  // Vertex operations

  /**
   * Adds a vertex with optional data.
   * @returns false if the vertex already exists, true otherwise
   */
  public addVertex(key: K, data?: V): boolean {
    if (this.vertices.has(key)) {
      return false;
    }
    this.vertices.set(key, data as V);
    this.edges.set(key, []);
    return true;
  }

  /**
   * Retrieves the data associated with a vertex.
   * @returns the data or null if the vertex doesn't exist
   */
  public getVertex(key: K): V | null {
    if (!this.vertices.has(key)) {
      return null;
    }
    return this.vertices.get(key) as V;
  }

  /**
   * Removes a vertex and all its connected edges.
   * @returns the removed vertex data or null if the vertex didn't exist
   */
  public removeVertex(key: K): V | null {
    if (!this.vertices.has(key)) {
      return null;
    }

    const data = this.vertices.get(key) as V;

    // Remove all edges pointing to this vertex
    for (const [fromKey, edgeList] of this.edges) {
      this.edges.set(
        fromKey,
        edgeList.filter(edge => edge.to !== key)
      );
    }

    // Remove the vertex and its outgoing edges
    this.vertices.delete(key);
    this.edges.delete(key);

    return data;
  }

  /**
   * Checks if a vertex exists in the graph.
   */
  public hasVertex(key: K): boolean {
    return this.vertices.has(key);
  }

  /**
   * Checks if the graph has any vertices.
   */
  public hasVerticies(): boolean {
    return this.vertices.size > 0;
  }

  // Edge operations

  /**
   * Adds a directed edge with optional data.
   * @throws Error if either vertex doesn't exist
   * @returns false if the edge already exists, true otherwise
   */
  public addEdge(from: K, to: K, data?: E): boolean {
    this.verifyVerticesExist(from, to);

    if (this.adjacent(from, to)) {
      return false;
    }

    const edgeList = this.edges.get(from)!;
    edgeList.push({ to, data: data as E });
    return true;
  }

  /**
   * Retrieves the data associated with an edge.
   * @throws Error if either vertex doesn't exist
   * @returns the edge data or null if the edge doesn't exist
   */
  public getEdge(from: K, to: K): E | null {
    this.verifyVerticesExist(from, to);

    const edgeList = this.edges.get(from)!;
    const edge = edgeList.find(e => e.to === to);
    return edge ? edge.data : null;
  }

  /**
   * Removes a directed edge.
   * @throws Error if either vertex doesn't exist
   * @returns the removed edge data or null if the edge didn't exist
   */
  public removeEdge(from: K, to: K): E | null {
    this.verifyVerticesExist(from, to);

    const edgeList = this.edges.get(from)!;
    const edgeIndex = edgeList.findIndex(e => e.to === to);

    if (edgeIndex === -1) {
      return null;
    }

    const [removed] = edgeList.splice(edgeIndex, 1);
    return removed.data;
  }

  /**
   * Checks if there is an edge from one vertex to another.
   * @throws Error if either vertex doesn't exist
   */
  public adjacent(from: K, to: K): boolean {
    this.verifyVerticesExist(from, to);

    const edgeList = this.edges.get(from)!;
    return edgeList.some(e => e.to === to);
  }

  // Query operations

  /**
   * Returns the keys of all neighboring vertices (outgoing edges).
   * @throws Error if the vertex doesn't exist
   */
  public neighbors(key: K): K[] {
    this.verifyVerticesExist(key);

    const edgeList = this.edges.get(key)!;
    return edgeList.map(e => e.to);
  }

  /**
   * Returns the data of all neighboring vertices.
   * @throws Error if the vertex doesn't exist
   */
  public neighborData(key: K): V[] {
    const neighborKeys = this.neighbors(key);
    return neighborKeys
      .map(k => this.vertices.get(k))
      .filter((v): v is V => v !== undefined);
  }

  /**
   * Returns all outgoing edges with their destination and data.
   * @throws Error if the vertex doesn't exist
   */
  public edgesFrom(key: K): Array<{ to: K; data: E }> {
    this.verifyVerticesExist(key);

    return [...this.edges.get(key)!];
  }

  // Private helpers

  private verifyVerticesExist(...keys: K[]): void {
    for (const key of keys) {
      if (!this.vertices.has(key)) {
        throw new Error(`vertex with key '${key}' does not exist`);
      }
    }
  }
}
