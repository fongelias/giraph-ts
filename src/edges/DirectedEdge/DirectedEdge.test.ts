import { DirectedEdge } from './DirectedEdge';

describe('DirectedEdge', () => {

  const origin = "origin";
  const destination = "destination";
  let edge: DirectedEdge<string>;

  beforeEach(() => {
    edge = new DirectedEdge<string>(origin, destination);
  });

  describe('#connects', () => {
    it('should return true if the vertex is at the origin of the edge', () => {
      expect(edge.connects(origin)).toBe(true);
    });

    it('should return true if the vertex is at the destination of the edge', () => {
      expect(edge.connects(destination)).toBe(true);
    });

    it('should return false if the vertex is not connected by the edge', () => {
      expect(edge.connects('neither vertex')).toBe(false);
    });
  });
});
