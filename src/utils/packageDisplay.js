/** Treat very large caps from the API as "unlimited". */
export const UNLIMITED_THRESHOLD = 9999;

export const isUnlimitedCount = (value) =>
  typeof value === 'number' && value >= UNLIMITED_THRESHOLD;

export const formatPrice = (price) => {
  if (price === undefined || price === null) return 'Custom';
  if (price === 0) return '$0';
  return `$${parseFloat(price).toFixed(0)}`;
};

export const formatLocationsSubtitle = (plan) => {
  const features = plan?.features || {};
  if (features.unlimited_locations || isUnlimitedCount(plan?.max_locations)) {
    return 'Unlimited Locations';
  }
  const count = plan?.max_locations ?? 1;
  return count === 1 ? 'Up to 1 Location' : `Up to ${count} Locations`;
};

export const formatUsersSubtitle = (plan) => {
  const features = plan?.features || {};
  if (features.expanded_roles || isUnlimitedCount(plan?.max_users)) {
    return 'Unlimited Users';
  }
  if (features.multiple_users_roles) {
    return 'Multiple users & roles';
  }
  const count = plan?.max_users ?? 1;
  return count === 1 ? '1 User included' : `${count} Users Included`;
};

const FEATURE_LABELS = {
  reporting: 'Reporting',
  forecaster: 'Forecaster',
  report_card: 'Report Card',
  cogs_budgeting: 'COGS Budgeting',
  labor_budgeting: 'Labor Budgeting',
  daily_reminders: 'Daily Reminders',
  auto_budgeting: 'Auto Budgeting',
  email_reporting: 'Email Reporting',
  pos_integration: 'POS Integration',
  priority_support: 'Priority Support',
  multiple_users_roles: 'Multiple Users & Roles',
  expanded_roles: 'Expanded Roles',
  multi_location_dashboard: 'Dashboard',
  compare_similar_restaurants: 'Compare Similar Restaurants',
  unlimited_locations: 'Unlimited Locations',
};

const SKIP_FEATURE_KEYS = new Set(['description']);

const formatFeatureDetail = (key, value) => {
  if (key === 'lio_ai_prompts_per_month' && typeof value === 'number') {
    if (isUnlimitedCount(value)) return 'Unlimited prompts';
    return `${value} prompts/month`;
  }
  if (key === 'multi_location_dashboard' && value === true) {
    return 'Access all locations from single dashboard';
  }
  if (key === 'multiple_users_roles' && value === true) {
    return 'Multiple users/roles';
  }
  if (key === 'expanded_roles' && value === true) {
    return 'Expanded roles (franchisors)';
  }
  if (key === 'unlimited_locations' && value === true) {
    return 'Unlimited locations';
  }
  if (typeof value === 'string' && value !== 'true' && value !== 'false') {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  if (value === true) return null;
  return null;
};

const buildUsersFeature = (plan) => {
  const features = plan?.features || {};
  if (features.expanded_roles) {
    return { key: 'users', label: 'Users', detail: 'Expanded roles (franchisors)', included: true };
  }
  if (features.multiple_users_roles) {
    return { key: 'users', label: 'Users', detail: 'Multiple users/roles', included: true };
  }
  const count = plan?.max_users ?? 1;
  return {
    key: 'users',
    label: 'Users',
    detail: count === 1 ? '1 user' : `${count} users`,
    included: true,
  };
};

const buildLocationsFeature = (plan) => {
  const features = plan?.features || {};
  if (features.unlimited_locations || isUnlimitedCount(plan?.max_locations)) {
    return { key: 'locations', label: 'Locations', detail: 'Unlimited locations', included: true };
  }
  const count = plan?.max_locations ?? 1;
  return {
    key: 'locations',
    label: 'Locations',
    detail: count === 1 ? '1 location' : `${count} locations`,
    included: true,
  };
};

const buildLioAiFeature = (plan) => {
  const prompts = plan?.features?.lio_ai_prompts_per_month;
  if (prompts == null) return null;
  return {
    key: 'lio_ai',
    label: 'Lio AI',
    detail: isUnlimitedCount(prompts) ? 'Unlimited prompts' : `${prompts} prompts/month`,
    included: true,
  };
};

/** Ordered display features for plan cards and modals. */
export const buildPlanDisplayFeatures = (plan) => {
  if (!plan) return [];

  const features = plan.features || {};
  const list = [];

  list.push(buildUsersFeature(plan));

  const lioAi = buildLioAiFeature(plan);
  if (lioAi) list.push(lioAi);

  if (features.multi_location_dashboard) {
    list.push({
      key: 'multi_location_dashboard',
      label: FEATURE_LABELS.multi_location_dashboard,
      detail: formatFeatureDetail('multi_location_dashboard', true),
      included: true,
    });
  }

  list.push(buildLocationsFeature(plan));

  const orderedKeys = [
    'reporting',
    'forecaster',
    'report_card',
    'cogs_budgeting',
    'labor_budgeting',
    'daily_reminders',
    'auto_budgeting',
    'email_reporting',
    'pos_integration',
    'priority_support',
    'compare_similar_restaurants',
  ];

  orderedKeys.forEach((key) => {
    if (SKIP_FEATURE_KEYS.has(key)) return;
    const value = features[key];
    if (value === undefined || value === false || value === null) return;

    list.push({
      key,
      label: FEATURE_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      detail: formatFeatureDetail(key, value),
      included: value !== false && value !== 'false',
    });
  });

  return list;
};

export const getPlanDescription = (plan) => plan?.features?.description || '';

export const getMaxLocationsCap = (plan) => {
  const planName = String(
    plan?.key || plan?.name || plan?.display_name || plan?.package_name || ''
  )
    .trim()
    .toLowerCase();
  if (planName.includes('lite')) return 1;
  if (planName.includes('grow')) return 5;
  if (planName.includes('pro')) return null;

  const features = plan?.features || {};
  if (features.unlimited_locations || isUnlimitedCount(plan?.max_locations)) {
    return null;
  }
  return plan?.max_locations ?? 1;
};
