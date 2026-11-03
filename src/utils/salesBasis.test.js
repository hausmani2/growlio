import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSalesReview, reportedSalesAmount, salesBasisNote } from './salesBasis.js';

describe('sales basis notes', () => {
  it('needs review outranks every other basis in a mixed week', () => {
    const note = salesBasisNote([
      { salesBasis: 'net' },
      { salesBasis: 'estimated_legacy' },
      { salesBasis: 'needs_review' },
    ]);
    assert.match(note.text, /review/i);
    assert.equal(note.tone, 'text-red-600');
  });

  it('estimated legacy is not labeled gross or verified net', () => {
    const note = salesBasisNote([
      { salesBasis: 'estimated_legacy' },
      { salesBasis: 'net' },
    ]);
    assert.match(note.text, /monthly total/i);
    assert.doesNotMatch(note.text, /verified net/i);
    assert.equal(note.tone, 'text-amber-700');
  });

  it('gross legacy, blank, and verified net keep distinct notes', () => {
    assert.match(salesBasisNote([{ salesBasis: 'gross_legacy' }]).text, /Not verified net/);
    assert.match(
      salesBasisNote([{ salesBasis: '', actualSalesInStore: '10' }]).text,
      /Gross Sales - Includes Tips/
    );
    const verified = salesBasisNote([{ salesBasis: 'manual', manualOverride: true }]);
    assert.match(verified.text, /Net sales exclude tax/);
    assert.match(verified.text, /Manually overridden/);
    assert.equal(verified.tone, 'text-green-700');
  });

  it('a review day does not yield a sales amount for a percentage', () => {
    assert.equal(isSalesReview({ sales_review: true, reported_sales: '100.00' }), true);
    assert.equal(reportedSalesAmount({ sales_review: true, reported_sales: '100.00' }), null);
    assert.equal(reportedSalesAmount({ sales_basis: 'needs_review', net_sales_actual: '50' }), null);
    assert.equal(reportedSalesAmount({ reported_sales: null, sales_review: false }), null);
    assert.equal(
      reportedSalesAmount({ reported_sales: '4370.97', sales_basis: 'estimated_legacy' }),
      4370.97
    );
  });
});
