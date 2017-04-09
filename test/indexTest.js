import index from '../src/index';
import assert from 'assert';

describe('Index', () => {
    it('should say "Hi!"', () => {
        assert.equal(index.hi, 'Hi!');
    });
});