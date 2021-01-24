import { VertexKey } from "verticies";

export class DirectedEdge<K extends VertexKey> {
  constructor(
    private origin: K,
    private destination: K
  ) {}

  public fromVertex(): K {
    return this.origin;
  }

  public toVertex(): K {
    return this.destination;
  }

  public connects(vertex: K): boolean {
    return vertex === this.origin || vertex === this.destination;
  }
}