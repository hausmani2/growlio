import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  shouldSeedDefaultExpenses,
  shouldApplyFranchiseExpenses,
  shouldResetInitializedOnEmptyList,
  mergeFranchiseExpenseFields,
  isRoyaltyField,
  isBrandAdFundField,
  FRANCHISE_ROYALTY_LABEL,
  FRANCHISE_BRAND_LABEL,
} from './expenseInitUtils.js';

const makeFranchiseField = ({ label, category, is_value_type }) => ({
  id: Math.random(),
  label,
  category,
  is_value_type,
  value: '',
  expense_type: 'monthly',
  is_active: false,
});

describe('shouldSeedDefaultExpenses', () => {
  it('seeds on initial empty page load', () => {
    assert.equal(
      shouldSeedDefaultExpenses({
        suppressDefaultInit: false,
        currentLength: 0,
        showDefaultExpenses: true,
        hasInitialized: false,
      }),
      true
    );
  });

  it('seeds empty list after init when defaults are still expected (reset race recovery)', () => {
    assert.equal(
      shouldSeedDefaultExpenses({
        suppressDefaultInit: false,
        currentLength: 0,
        showDefaultExpenses: true,
        hasInitialized: true,
      }),
      true
    );
  });

  it('does not seed while suppressDefaultInit is true', () => {
    assert.equal(
      shouldSeedDefaultExpenses({
        suppressDefaultInit: true,
        currentLength: 0,
        showDefaultExpenses: true,
        hasInitialized: false,
      }),
      false
    );
  });

  it('does not seed when rows already exist (saved or defaults)', () => {
    assert.equal(
      shouldSeedDefaultExpenses({
        suppressDefaultInit: false,
        currentLength: 12,
        showDefaultExpenses: true,
        hasInitialized: false,
      }),
      false
    );
  });

  it('does not re-seed empty list when Expense is already complete', () => {
    assert.equal(
      shouldSeedDefaultExpenses({
        suppressDefaultInit: false,
        currentLength: 0,
        showDefaultExpenses: false,
        hasInitialized: true,
      }),
      false
    );
  });
});

describe('shouldApplyFranchiseExpenses', () => {
  it('applies franchise rows only onto a non-empty initialized list', () => {
    assert.equal(
      shouldApplyFranchiseExpenses({
        isFranchise: true,
        hasInitialized: true,
        currentLength: 10,
      }),
      true
    );
  });

  it('never applies franchise-only replace on an empty list', () => {
    assert.equal(
      shouldApplyFranchiseExpenses({
        isFranchise: true,
        hasInitialized: true,
        currentLength: 0,
      }),
      false
    );
  });

  it('skips non-franchise locations', () => {
    assert.equal(
      shouldApplyFranchiseExpenses({
        isFranchise: false,
        hasInitialized: true,
        currentLength: 10,
      }),
      false
    );
  });

  it('skips until initialization finished', () => {
    assert.equal(
      shouldApplyFranchiseExpenses({
        isFranchise: true,
        hasInitialized: false,
        currentLength: 10,
      }),
      false
    );
  });
});

describe('shouldResetInitializedOnEmptyList', () => {
  it('resets after location clear when defaults are expected', () => {
    assert.equal(
      shouldResetInitializedOnEmptyList({
        hasInitialized: true,
        currentLength: 0,
        showDefaultExpenses: true,
      }),
      true
    );
  });

  it('does not reset when waiting for saved expense data', () => {
    assert.equal(
      shouldResetInitializedOnEmptyList({
        hasInitialized: true,
        currentLength: 0,
        showDefaultExpenses: false,
      }),
      false
    );
  });

  it('does not reset when the list still has rows', () => {
    assert.equal(
      shouldResetInitializedOnEmptyList({
        hasInitialized: true,
        currentLength: 5,
        showDefaultExpenses: true,
      }),
      false
    );
  });
});

describe('mergeFranchiseExpenseFields', () => {
  it('appends Royalty and Brand/Ad Fund to the full default list', () => {
    const defaults = [
      { id: 1, label: 'Rent', category: 'Rent' },
      { id: 2, label: 'Gas', category: 'Utilities' },
    ];
    const merged = mergeFranchiseExpenseFields(defaults, makeFranchiseField);
    assert.equal(merged.length, 4);
    assert.ok(merged.some(isRoyaltyField));
    assert.ok(merged.some(isBrandAdFundField));
    assert.equal(merged[0].label, 'Rent');
    assert.equal(merged[1].label, 'Gas');
  });

  it('does not duplicate franchise rows', () => {
    const current = [
      { id: 1, label: 'Rent', category: 'Rent' },
      { id: 2, label: FRANCHISE_ROYALTY_LABEL, category: 'Royalty + Ad Fund' },
      { id: 3, label: FRANCHISE_BRAND_LABEL, category: 'Royalty + Ad Fund' },
    ];
    const merged = mergeFranchiseExpenseFields(current, makeFranchiseField);
    assert.equal(merged, current);
    assert.equal(merged.length, 3);
  });

  it('returns empty list unchanged (never franchise-only replace)', () => {
    const merged = mergeFranchiseExpenseFields([], makeFranchiseField);
    assert.deepEqual(merged, []);
  });

  it('adds only the missing franchise field', () => {
    const current = [
      { id: 1, label: 'Rent', category: 'Rent' },
      { id: 2, label: FRANCHISE_ROYALTY_LABEL, category: 'Royalty + Ad Fund' },
    ];
    const merged = mergeFranchiseExpenseFields(current, makeFranchiseField);
    assert.equal(merged.length, 3);
    assert.ok(merged.some(isBrandAdFundField));
  });
});

describe('location switch / reset timing scenarios', () => {
  it('models wipe-after-init then recovery for first-visit defaults', () => {
    // Child seeded defaults and marked initialized
    let hasInitialized = true;
    let currentLength = 12;
    assert.equal(
      shouldSeedDefaultExpenses({
        currentLength,
        showDefaultExpenses: true,
        hasInitialized,
      }),
      false
    );

    // Parent location reset clears the list (race)
    currentLength = 0;
    assert.equal(
      shouldResetInitializedOnEmptyList({
        hasInitialized,
        currentLength,
        showDefaultExpenses: true,
      }),
      true
    );
    hasInitialized = false;

    // Franchise must not fill the empty hole
    assert.equal(
      shouldApplyFranchiseExpenses({
        isFranchise: true,
        hasInitialized: true,
        currentLength: 0,
      }),
      false
    );

    // Defaults seed again
    assert.equal(
      shouldSeedDefaultExpenses({
        currentLength: 0,
        showDefaultExpenses: true,
        hasInitialized,
      }),
      true
    );
    currentLength = 12;
    hasInitialized = true;

    // Then franchise appends onto the full list
    assert.equal(
      shouldApplyFranchiseExpenses({
        isFranchise: true,
        hasInitialized,
        currentLength,
      }),
      true
    );
  });

  it('models non-franchise first visit (no franchise merge)', () => {
    assert.equal(
      shouldSeedDefaultExpenses({
        currentLength: 0,
        showDefaultExpenses: true,
        hasInitialized: false,
      }),
      true
    );
    assert.equal(
      shouldApplyFranchiseExpenses({
        isFranchise: false,
        hasInitialized: true,
        currentLength: 12,
      }),
      false
    );
  });

  it('models saved expense data: do not seed or reset over existing rows', () => {
    assert.equal(
      shouldSeedDefaultExpenses({
        currentLength: 8,
        showDefaultExpenses: false,
        hasInitialized: false,
      }),
      false
    );
    assert.equal(
      shouldResetInitializedOnEmptyList({
        hasInitialized: true,
        currentLength: 8,
        showDefaultExpenses: false,
      }),
      false
    );
  });
});
