import { VertexKey } from "verticies";

// Basic Behaviors
export interface BaseGraphBehavior<K extends VertexKey, E> {
  hasVertex: (vertexKey: K) => boolean;
  adjacent: (fromVertex: K, toVertex: K) => boolean;
  neighbors: (vertexKey: K) => K[];
  edgesFrom: (vertexKey: K) => E[];
  // Edge behaviors are tied to the atomic implementation, and a "base graph" refers to such implementation
}

export interface BasicVertexBehavior<K extends VertexKey> {
  addVertex: (vertex: K) => boolean;
  removeVertex: (vertex: K) => boolean;
}

// Compositional Behaviors
export interface StructuredVertexBehavior<K extends VertexKey, V> {
  addVertex: (vertexKey: K, vertexValue: V) => boolean;
  removeVertex: (vertex: K) => boolean;
}

export interface DirectedEdgeBehavior<K extends VertexKey> {
  addEdge: (fromVertex: K, toVertex: K) => boolean;
  removeEdge: (fromVertex: K, toVertex: K) => boolean;
}

export interface WeightedDirectedEdgeBehavior<K extends VertexKey, W> {
  addEdge: (fromVertex: K, toVertex: K, weight: W) => boolean;
  removeEdge: (fromVertex: K, toVertex: K) => boolean;
}

export interface UndirectedEdgeBehavior<K extends VertexKey> {
  addEdge: (xVertex: K, yVertex: K) => boolean;
  removeEdge: (xVertex: K, yVertex: K) => boolean;
}

export interface UndirectedWeightedEdgeBehavior<K extends VertexKey, W> {
  addEdge: (xVertex: K, yVertex: K, weight: W) => boolean;
  removeEdge: (xVertex: K, yVertex: K) => boolean;
}
