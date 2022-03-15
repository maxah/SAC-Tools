import _ from 'lodash';
import assert from 'assert';
import {
  createDate
} from './util/dates';

import * as compare from '../src/compare';
import moment from 'moment';

describe('compare', () => {
  describe('bytes', () => {
    describe('.assert', () => {
      it('asserts using string expression', () => {
        const match = compare.isNumber(10485760).assert('10m');
        assert.strictEqual(match, true);
      });

      it('returns false when an expression does not match', () => {
        const match = compare.isNumber(100).assert('10m');
        assert.strictEqual(match, false);
      });

      it('supports less than comparisons', () => {
        const match = compare.isNumber(9).assert('<10');
        assert.strictEqual(match, true);
      });

      it('supports less than or equal to comparisons', () => {
        const match = compare.isNumber(9).assert('<=10');
        assert.strictEqual(match, true);
      });

      it('supports greater than comparisons', () => {
        const match = compare.isNumber(11).assert('>10');
        assert.strictEqual(match, true);
      });

      it('supports greater or equal than comparisons', () => {
        const match = compare.isNumber(11).assert('>=10');
        assert.strictEqual(match, true);
      });

      it('ignores whitespace', () => {
        const match = compare.isNumber(11).assert('>=   10 ');
        assert.strictEqual(match, true);
      });

      it('magnifies kilobytes', () => {
        const match = compare.isNumber(10240).assert('10kb');
        assert.strictEqual(match, true);
      });

      it('magnifies megabytes', () => {
        const match = compare.isNumber(10485760).assert('10m');
        assert.strictEqual(match, true);
      });

      it('magnifies gigabytes', () => {
        const match = compare.isNumber(10737418240).assert('10g');
        assert.strictEqual(match, true);
      });

      it('magnifies terabytes', () => {
        const match = compare.isNumber(10995116277760).assert('10t');
        assert.strictEqual(match, true);
      });
    });

    describe('.equalTo', () => {
      it('returns true when equal', () => {
        const match = compare.isNumber(1048576).equalTo(1, 'm');
        assert.strictEqual(match, true);
      });

      it('returns false when not equal', () => {
        const match = compare.isNumber(1024).equalTo(1, 'm');
        assert.strictEqual(match, false);
      });
    });

    describe('.lessThan', () => {
      it('returns true when less than', () => {
        const match = compare.isNumber(9437184).lessThan(10, 'm');
        assert.strictEqual(match, true);
      });

      it('returns false when less than', () => {
        const match = compare.isNumber(11534336).lessThan(10, 'm');
        assert.strictEqual(match, false);
      });
    });

    describe('.lessThanOrEqual', () => {
      it('returns true when less or equal to', () => {
        const match = compare.isNumber(1024).lessThanOrEqual(1, 'k');
        assert.strictEqual(match, true);
      });

      it('returns false when not less or equal to', () => {
        const match = compare.isNumber(1025).lessThanOrEqual(1, 'k');
        assert.strictEqual(match, false);
      });
    });

    describe('.greaterThan', () => {
      it('returns true when the value is greater', () => {
        const match = compare.isNumber(10485761).greaterThan(10, 'm');
        assert.strictEqual(match, true);
      });

      it('returns false when the value is not greater', () => {
        const match = compare.isNumber(10485760).greaterThan(10, 'm');
        assert.strictEqual(match, false);
      });
    });

    describe('.greaterThanOrEqual', () => {
      it('returns true when equal to', () => {
        const match = compare.isNumber(10485760).greaterThanOrEqual(10, 'm');
        assert.strictEqual(match, true);
      });

      it('returns true when greater than', () => {
        const match = compare.isNumber(10486784).greaterThanOrEqual(10, 'm');
        assert.strictEqual(match, true);
      });

      it('returns false when not greater than or equal to', () => {
        const match = compare.isNumber(9485761).greaterThanOrEqual(10, 'm');
        assert.strictEqual(match, false);
      });
    });
  });

  describe('date', () => {
    describe('.assert', () => {
      it('date equal in days', () => {
        const match = compare.isDate(createDate(10)).assert('== 10 days');
        assert.strictEqual(match, true);
      });

      it('accepts a ISO formatted string', () => {
        const date = moment().subtract(20, 'days').format();
        const match = compare.isDate(date).assert('== 20 days');
        assert.strictEqual(match, true);
      });

      it('accepts a date object', () => {
        const date = new Date();
        const match = compare.isDate(date).assert('< 1 min');
        assert.strictEqual(match, true);
      });

      it('defaults to equal in days', () => {
        const match = compare.isDate(createDate(10)).assert(10);
        assert.strictEqual(match, true);
      });

      it('date less than n days', () => {
        _.range(0, 10).forEach((n) => {
          const match = compare.isDate(createDate(n)).assert('<10 days');
          assert.strictEqual(match, true);
        });
      });

      it('date greater than in days', () => {
        _.range(0, 11).forEach((n) => {
          const match = compare.isDate(createDate(n)).assert('>10 days');
          assert.strictEqual(match, false);
        });

        _.range(11, 20).forEach((n) => {
          const match = compare.isDate(createDate(n)).assert('>10 days');
          assert.strictEqual(match, true);
        });
      });

      it('less than 1 day', () => {
        const match = compare.isDate(createDate(1, 'minutes')).assert('<1 days');
        assert.strictEqual(match, true);
      });

      it('supports greater or equal than comparisons', () => {
        const match = compare.isDate(createDate(10)).assert('>=10');
        assert.strictEqual(match, true);
      });

      it('supports less or equal than comparisons', () => {
        const match = compare.isDate(createDate(10)).assert('<=10');
        assert.strictEqual(match, true);
      });

      it('supports greater or equal than comparisons', () => {
        const match = compare.isNumber(11).assert('>=10');
        assert.strictEqual(match, true);
      });

      it('date equal in hours', () => {
        const match = compare.isDate(createDate(10, 'hours')).assert('10 hours');
        assert.strictEqual(match, true);
      });

      it('date less than n hours', () => {
        _.range(0, 10).forEach((n) => {
          const match = compare.isDate(createDate(n, 'hours')).assert('<10 hours');
          assert.strictEqual(match, true);
        });
      });

      it('date greater than in hours', () => {
        _.range(0, 11).forEach((n) => {
          const match = compare.isDate(createDate(n, 'hours')).assert('>10 hours');
          assert.strictEqual(match, false);
        });

        _.range(11, 20).forEach((n) => {
          const match = compare.isDate(createDate(n, 'hours')).assert('>10 hours');
          assert.strictEqual(match, true);
        });
      });

      it('less than 1 hour', () => {
        const match = compare.isDate(createDate(1, 'hours')).assert('<10 hours');
        assert.strictEqual(match, true);
      });

      it('accepts unit aliases', () => {
        const match = compare.isDate(createDate(1, 'minutes')).assert('<10mins');
        assert.strictEqual(match, true);
      });

      it('date equal in minutes', () => {
        const match = compare.isDate(createDate(10, 'minutes')).assert('== 10 minutes');
        assert.strictEqual(match, true);
      });

      it('date less than n minutes', () => {
        _.range(0, 10).forEach((n) => {
          const match = compare.isDate(createDate(n, 'minutes')).assert('< 10 minutes');
          assert.strictEqual(match, true);
        });
      });

      it('date greater than in minutes', () => {
        _.range(0, 11).forEach((n) => {
          const match = compare.isDate(createDate(n, 'minutes')).assert('> 10 minutes');
          assert.strictEqual(match, false);
        });

        _.range(11, 20).forEach((n) => {
          const match = compare.isDate(createDate(n, 'minutes')).assert('> 10 minutes');
          assert.strictEqual(match, true);
        });
      });
    });

    describe('.lessThan', () => {
      it('returns true when less than', () => {
        const match = compare.isDate(createDate(10)).lessThan(11, 'days');
        assert.strictEqual(match, true);
      });

      it('returns false when not less than', () => {
        const match = compare.isDate(createDate(11)).lessThan(11, 'days');
        assert.strictEqual(match, false);
      });
    });

    describe('.greaterThan', () => {
      it('returns true when greater than', () => {
        const match = compare.isDate(createDate(11, 'minutes')).greaterThan(10, 'minutes');
        assert.strictEqual(match, true);
      });

      it('returns false when not greater than', () => {
        const match = compare.isDate(createDate(10, 'minutes')).greaterThan(10, 'minutes');
        assert.strictEqual(match, false);
      });
    });

    describe('.greaterThanOrEqual', () => {
      it('returns true when greater than', () => {
        const match = compare.isDate(createDate(11, 'minutes')).greaterThanOrEqual(10, 'minutes');
        assert.strictEqual(match, true);
      });

      it('returns true when equal to', () => {
        const match = compare.isDate(createDate(10, 'minutes')).greaterThanOrEqual(10, 'minutes');
        assert.strictEqual(match, true);
      });

      it('returns false when not greater than', () => {
        const match = compare.isDate(createDate(9, 'minutes')).greaterThanOrEqual(10, 'minutes');
        assert.strictEqual(match, false);
      });
    });

    describe('.equalTo', () => {
      it('returns true when equal to', () => {
        const match = compare.isDate(createDate(11, 'hours')).equalTo(11, 'hours');
        assert.strictEqual(match, true);
      });

      it('returns false when not equal to', () => {
        const match = compare.isDate(createDate(10, 'hours')).equalTo(0, 'hours');
        assert.strictEqual(match, false);
      });
    });
  });
});
