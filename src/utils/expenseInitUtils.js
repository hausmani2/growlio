/**
 * Pure helpers for expense page initialization / franchise merge.
 * Keeps OperatingExpenses race-safe without changing business rules.
 */

export const FRANCHISE_ROYALTY_LABEL = 'Royalty';
export const FRANCHISE_BRAND_LABEL = 'Brand/Ad Fund';
export const FRANCHISE_CATEGORY = 'Royalty + Ad Fund';

const lower = (s) => String(s || '').toLowerCase();

export const isRoyaltyField = (field) => lower(field?.label || field?.name).includes('royalty');

export const isBrandAdFundField = (field) => {
  const label = lower(field?.label || field?.name);
  return label.includes('brand') || label.includes('ad fund') || label.includes('fund');
};

/**
 * True when defaults should be (re)seeded into an empty list.
 * If the list was cleared after init (location reset race), showDefaultExpenses
 * still allows reload; !hasInitialized covers first mount.
 */
export const shouldSeedDefaultExpenses = ({
  suppressDefaultInit = false,
  currentLength = 0,
  showDefaultExpenses = false,
  hasInitialized = false,
} = {}) => {
  if (suppressDefaultInit) return false;
  if (currentLength > 0) return false;
  return showDefaultExpenses || !hasInitialized;
};

/**
 * Franchise extras must never replace a full list.
 * Skip when uninitialized or when the list is empty (wait for defaults / saved rows).
 */
export const shouldApplyFranchiseExpenses = ({
  isFranchise = false,
  hasInitialized = false,
  currentLength = 0,
} = {}) => {
  if (!isFranchise || !hasInitialized) return false;
  if (currentLength === 0) return false;
  return true;
};

/**
 * Append missing Royalty / Brand/Ad Fund rows. Does not remove or rewrite others.
 * Returns the same array reference when nothing changes.
 */
export const mergeFranchiseExpenseFields = (currentFields, createField) => {
  const current = Array.isArray(currentFields) ? currentFields : [];
  if (current.length === 0) return current;

  const hasRoyalty = current.some(isRoyaltyField);
  const hasBrand = current.some(isBrandAdFundField);
  if (hasRoyalty && hasBrand) return current;

  const next = [...current];
  if (!hasRoyalty && typeof createField === 'function') {
    next.push(
      createField({
        label: FRANCHISE_ROYALTY_LABEL,
        category: FRANCHISE_CATEGORY,
        is_value_type: false,
      })
    );
  }
  if (!hasBrand && typeof createField === 'function') {
    next.push(
      createField({
        label: FRANCHISE_BRAND_LABEL,
        category: FRANCHISE_CATEGORY,
        is_value_type: false,
      })
    );
  }
  return next;
};

/**
 * After an external clear (parent location reset), drop the initialized flag
 * so defaults can seed again. Only when first-visit defaults are expected —
 * do not reset while waiting to apply saved expense rows.
 */
export const shouldResetInitializedOnEmptyList = ({
  hasInitialized = false,
  currentLength = 0,
  showDefaultExpenses = false,
} = {}) => hasInitialized && currentLength === 0 && showDefaultExpenses;
