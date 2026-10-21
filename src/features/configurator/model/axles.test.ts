import { describe,it,expect } from 'vitest';
import { compareAxles } from './axles';
describe('gravity axle interfaces',()=>{
 it('distinguishes equal-dimension DH non-Boost and Boost interfaces',()=>{expect(compareAxles('20x110 DH non-Boost','20 × 110 Boost')).toBe('different');});
 it('does not turn unspecified 20×110 standards into confirmed compatibility or conflict',()=>{expect(compareAxles('20x110','20x110 Boost')).toBe('unknown');expect(compareAxles('20x110 DH non-Boost','20x110')).toBe('unknown');expect(compareAxles('20x110','20x110')).toBe('unknown');});
 it('matches explicit formats and keeps dimension differences as conflicts',()=>{expect(compareAxles('20x110 Boost','20 × 110 BOOST')).toBe('same');expect(compareAxles('20x110 DH non-Boost','20x110 non boost')).toBe('same');expect(compareAxles('15x110','20x110')).toBe('different');expect(compareAxles('12x148','12 × 148')).toBe('same');});
 it('preserves unknown absent data instead of inventing a standard',()=>{expect(compareAxles(null,'20x110')).toBe('unknown');});
});
