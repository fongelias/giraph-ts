import { Vertex, VertexKey } from "verticies";


// Properties to support:
// Direction, Undirectedness
// Weights
// Vertex values
// Start with base graphs

// See if we can decompose them after into behaviors
export interface DirectedGraph {}

export interface DirectedWeightedGraph {}

export interface UndirectedGraph {}

export interface UndirectedWeightedGraph {}

// Graph Behaviors
export interface BaseGraphBehavior<K extends VertexKey> {
  hasVertex: (vertexKey: K) => boolean;
  adjacent: (fromVertex: K, toVertex: K) => boolean;
  neighbors: (vertexKey: K) => boolean;
}

export interface BasicVertexBehavior<K extends VertexKey> {
  addVertex: (vertex: K) => boolean;
  removeVertex: (vertex: K) => boolean;
}

export interface StructuredVertexBehavior<K extends VertexKey, V> {
  addVertex: (vertexKey: K, vertexValue: V) => boolean;
  removeVertex: (vertex: K) => boolean;
}

export interface DirectedEdgeBehavior<K extends VertexKey> {
  addEdge: (fromVertex: K, toVertex: K) => boolean;
  removeEdge: (fromVertex: K, toVertex: K) => boolean;
}

export interface WeightedEdgeBehavior<K extends VertexKey, W> {
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
