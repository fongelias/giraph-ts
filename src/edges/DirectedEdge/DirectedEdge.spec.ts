import { DirectedEdge } from './DirectedEdge';

describe('DirectedEdge', () => {
	describe('#connects', () => {
		const fromVertex = "start";
		const toVertex = "end";
		const edge = new DirectedEdge<string>(fromVertex, toVertex);

		describe('if the vertex is connected', () => {

			it('should return true if the vertex is equivalent to the fromVertex', () => {
				expect(edge.connects(fromVertex)).toBe(true);
			});

			it('should return true if the vertex is equivalent to the toVertex', () => {
				expect(edge.connects(toVertex)).toBe(true);
			});
		});

		
		describe('if the vertex is not connected', () => {
			const otherVertex = "notConnected";
			
			it('should return false', () => {
				expect(edge.connects(otherVertex)).toBe(false);
			});
		});
	});
})