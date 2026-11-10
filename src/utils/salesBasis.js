export function dayHasChannelSales(day) {
  return Object.keys(day || {}).some((key) => (
    key.startsWith('actualSales')
    && Math.abs(parseFloat(day[key]) || 0) > 0.009
  ));
}

function basisOf(day) {
  return day?.salesBasis || day?.sales_basis || '';
}

export function isSalesReview(sales) {
  if (!sales) return false;
  if (sales.sales_review === true || sales.salesReview === true) return true;
  return basisOf(sales) === 'needs_review';
}

export function reportedSalesAmount(sales) {
  if (!sales || isSalesReview(sales)) return null;
  if (sales.reported_sales === null) return null;
  const raw = sales.reported_sales != null ? sales.reported_sales : sales.net_sales_actual;
  if (raw === null || raw === undefined || raw === '') return null;
  const amount = parseFloat(raw);
  return Number.isFinite(amount) ? amount : null;
}

function moneyLabel(value) {
  const amount = parseFloat(value);
  if (!Number.isFinite(amount) || Math.abs(amount) < 0.005) return null;
  return `$${amount.toFixed(2)}`;
}

/**
 * Per-day Square / Close Day breakdown for Net Sales hover.
 * Returns labels like "Tax $12.34" only when the amount is present.
 */
export function daySalesBreakdownParts(day) {
  if (!day) return [];
  const parts = [];
  const tax = moneyLabel(day.salesTax ?? day.sales_tax);
  const tips = moneyLabel(day.tips);
  const service = moneyLabel(day.serviceCharges ?? day.service_charges);
  const discounts = moneyLabel(day.discounts);
  const refunds = moneyLabel(day.refunds);
  if (tax) parts.push(`Tax ${tax}`);
  if (tips) parts.push(`Tips ${tips}`);
  if (service) parts.push(`Service ${service}`);
  if (discounts) parts.push(`Discounts ${discounts}`);
  if (refunds) parts.push(`Refunds ${refunds}`);
  return parts;
}

export function salesBasisNote(days) {
  const rows = (days || []).filter(Boolean);
  if (rows.some((day) => isSalesReview(day))) {
    return {
      tone: 'text-red-600',
      text: 'Sales need review. Labor and food percentages are withheld until the day is verified.',
    };
  }
  if (rows.some((day) => basisOf(day) === 'estimated_legacy')) {
    return {
      tone: 'text-amber-700',
      text: 'Estimated from a monthly total split across open days. Not verified daily sales and not historical gross sales.',
    };
  }
  if (rows.some((day) => basisOf(day) === 'gross_legacy')) {
    return {
      tone: 'text-red-600',
      text: 'Gross sales — includes tips and other service charges. Not verified net sales.',
    };
  }
  const unclassifiedWithSales = rows.some((day) => !basisOf(day) && dayHasChannelSales(day));
  const verified = rows.some((day) => basisOf(day) === 'net' || basisOf(day) === 'manual');
  if (unclassifiedWithSales || !verified) {
    return {
      tone: 'text-red-600',
      text: 'Gross Sales - Includes Tips & Other Service Charges',
    };
  }
  const note = {
    tone: 'text-green-700',
    text: 'Net sales exclude tax, tips, and service charges',
  };
  if (rows.some((day) => day.manualOverride || day.manual_override)) {
    note.text += '. Manually overridden';
  }
  return note;
}
