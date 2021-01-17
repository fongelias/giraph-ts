import { WeightedDirectedEdge } from './WeightedDirectedEdge';

describe('WeightedDirectedEdge', () => {
    const fromVertex = "start";
    const toVertex = "end";
    const weight = 100;
    const edge = new WeightedDirectedEdge<string, number>(fromVertex, toVertex, weight);
    
    describe('#getWeight', () => {
      it('should return a weight', () => {
        expect(edge.getWeight()).toBe(weight);
      });
    });
});
