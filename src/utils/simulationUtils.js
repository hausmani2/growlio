/**
 * Simulation Onboarding Utility Functions
 * 
 * Handles API-driven redirect logic for restaurant simulation onboarding
 */

import { apiPost } from './axiosInterceptors';
import { ONBOARDING_ROUTES } from './onboardingUtils';

/**
 * Check restaurant simulation status and redirect to onboarding if needed
 * This function calls the POST API endpoint to check/update simulation status
 * and redirects to onboarding if restaurant_simulation is true
 * 
 * @param {Function} navigate - React Router navigate function
 * @param {Object} payload - Optional payload to send with POST request
 * @returns {Promise<{success: boolean, shouldRedirect: boolean, data?: any, error?: string}>}
 */
export const checkAndRedirectToSimulation = async (navigate, payload = {}) => {
  try {
    // Call POST API endpoint
    const response = await apiPost('/authentication/user/restaurant-simulation/', payload);
    
    // Check if response indicates simulation mode
    if (response.data && response.data.restaurant_simulation === true) {
      // Redirect to onboarding flow
      navigate(ONBOARDING_ROUTES.SIMULATION, { replace: true });
      return {
        success: true,
        shouldRedirect: true,
        data: response.data
      };
    }
    
    return {
      success: true,
      shouldRedirect: false,
      data: response.data
    };
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 
                        error?.response?.data?.error || 
                        error.message || 
                        'Failed to check restaurant simulation status';
    
    return {
      success: false,
      shouldRedirect: false,
      error: errorMessage
    };
  }
};

/**
 * Default expense categories based on the images provided
 */
export const EXPENSE_CATEGORIES = [
  'Rent',
  'Cost of Goods Sold',
  'Labor',
  'Utilities',
  'Dishwasher',
  'Insurance',
  'Janitoral Expenses',
  'Dues and Subscriptions',
  'Bank Charges',
  'Licenses & Permits',
  'Advertising and Promotion',
  'Loan',
  'Taxes',
  'Flowers',
  'Supplies',
  'Printing & Reproduction',
  'Repairs and Maintenance',
  'Meals and Entertainment',
  'Legal & Acct',
  'Payroll & Acct'
];

/**
 * Default expenses with categories and subcategories
 * Based on the images provided
 */
export const DEFAULT_EXPENSES = [
  // Rent
  {
    category: 'Rent',
    is_value_type: true,
    name: 'Rent',
    amount: 2500,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Cost of Goods Sold
  {
    category: 'Cost of Goods Sold',
    is_value_type: false, // Percentage
    name: 'Cost of Goods Sold',
    amount: 30,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Labor - General Labor
  {
    category: 'Labor',
    is_value_type: true,
    name: 'General Labor',
    amount: 5000,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Labor',
    is_value_type: true,
    name: 'Franchise Owner',
    amount: 2000,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Labor',
    is_value_type: false, // Percentage
    name: 'Payroll Taxes',
    amount: 8,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Utilities - Gas
  {
    category: 'Utilities',
    is_value_type: true,
    name: 'Gas',
    amount: 200,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Utilities',
    is_value_type: true,
    name: 'Electric',
    amount: 400,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Utilities',
    is_value_type: true,
    name: 'Telephone & Internet',
    amount: 150,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Utilities',
    is_value_type: true,
    name: 'Water',
    amount: 100,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Dishwasher
  {
    category: 'Dishwasher',
    is_value_type: true,
    name: 'Dishwasher',
    amount: 100,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Insurance - Workmans Comp
  {
    category: 'Insurance',
    is_value_type: false, // Percentage
    name: 'Workmans Comp',
    amount: 2.5,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Insurance',
    is_value_type: true,
    name: 'General Liab',
    amount: 300,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Janitoral Expenses
  {
    category: 'Janitoral Expenses',
    is_value_type: true,
    name: 'Rug and Towel Rental',
    amount: 120,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Janitoral Expenses',
    is_value_type: true,
    name: 'Garbage Removal',
    amount: 150,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Janitoral Expenses',
    is_value_type: true,
    name: 'Pest Control',
    amount: 75,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Janitoral Expenses',
    is_value_type: true,
    name: 'Supplies',
    amount: 200,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Janitoral Expenses',
    is_value_type: true,
    name: 'Chemicals',
    amount: 100,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Janitoral Expenses',
    is_value_type: true,
    name: 'Window Washing',
    amount: 80,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Dues and Subscriptions
  {
    category: 'Dues and Subscriptions',
    is_value_type: true,
    name: 'Point of Sale System',
    amount: 200,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Dues and Subscriptions',
    is_value_type: true,
    name: 'Time Clock System',
    amount: 50,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Dues and Subscriptions',
    is_value_type: true,
    name: 'Security System',
    amount: 100,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Dues and Subscriptions',
    is_value_type: true,
    name: 'Scheduling Software',
    amount: 40,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Dues and Subscriptions',
    is_value_type: true,
    name: 'Website Hosting',
    amount: 30,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Dues and Subscriptions',
    is_value_type: true,
    name: 'Rewards Card',
    amount: 25,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Dues and Subscriptions',
    is_value_type: true,
    name: 'Technology Support',
    amount: 150,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Bank Charges
  {
    category: 'Bank Charges',
    is_value_type: true,
    name: 'Service Charges',
    amount: 50,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Bank Charges',
    is_value_type: true,
    name: 'Cash Logistics',
    amount: 100,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Bank Charges',
    is_value_type: false, // Percentage
    name: 'Credit Card Fees',
    amount: 2.5,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Licenses & Permits
  {
    category: 'Licenses & Permits',
    is_value_type: true,
    name: 'Annual Corporate Fee',
    amount: 25,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Licenses & Permits',
    is_value_type: true,
    name: 'Health Department',
    amount: 50,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Advertising and Promotion
  {
    category: 'Advertising and Promotion',
    is_value_type: true,
    name: 'Charitable Donations',
    amount: 100,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Loan
  {
    category: 'Loan',
    is_value_type: true,
    name: 'Loan',
    amount: 1500,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Taxes
  {
    category: 'Taxes',
    is_value_type: true,
    name: 'Personal Property',
    amount: 100,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Flowers
  {
    category: 'Flowers',
    is_value_type: true,
    name: 'Flowers',
    amount: 50,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Supplies
  {
    category: 'Supplies',
    is_value_type: true,
    name: 'Kitchen Supplies',
    amount: 300,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Supplies',
    is_value_type: true,
    name: 'Office Supplies',
    amount: 75,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Supplies',
    is_value_type: true,
    name: 'Postage and Shipping',
    amount: 50,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Supplies',
    is_value_type: true,
    name: 'Uniforms',
    amount: 150,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  {
    category: 'Supplies',
    is_value_type: true,
    name: 'Carbon Tank Refills',
    amount: 80,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Printing & Reproduction
  {
    category: 'Printing & Reproduction',
    is_value_type: true,
    name: 'Printing & Reproduction',
    amount: 100,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Repairs and Maintenance
  {
    category: 'Repairs and Maintenance',
    is_value_type: true,
    name: 'Repairs and Maintenance',
    amount: 300,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Meals and Entertainment
  {
    category: 'Meals and Entertainment',
    is_value_type: true,
    name: 'Meals and Entertainment',
    amount: 200,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Legal & Acct
  {
    category: 'Legal & Acct',
    is_value_type: true,
    name: 'Legal & Acct',
    amount: 300,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  },
  
  // Payroll & Acct
  {
    category: 'Payroll & Acct',
    is_value_type: true,
    name: 'Payroll & Acct',
    amount: 200,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  }
];

/**
 * Convert expense data to API format
 */
export const formatExpenseForAPI = (expense) => {
  return {
    category: expense.category,
    is_value_type: expense.is_value_type,
    name: expense.name,
    amount: parseFloat(expense.amount) || 0,
    fixed_expense_type: expense.fixed_expense_type,
    is_active: expense.is_active
  };
};

/**
 * Calculate monthly cost from expense
 * @param {Object} expense - Expense object
 * @returns {number} - Monthly cost
 */
export const calculateMonthlyCost = (expense) => {
  if (!expense.is_active) return 0;
  
  const amount = parseFloat(expense.amount) || 0;
  
  if (expense.fixed_expense_type === 'WEEKLY') {
    // Convert weekly to monthly: weekly * 4.33
    return amount * 4.33;
  }
  
  // Already monthly
  return amount;
};

/**
 * Calculate weekly cost from expense
 * @param {Object} expense - Expense object
 * @returns {number} - Weekly cost
 */
export const calculateWeeklyCost = (expense) => {
  if (!expense.is_active) return 0;
  
  const amount = parseFloat(expense.amount) || 0;
  
  if (expense.fixed_expense_type === 'MONTHLY') {
    // Convert monthly to weekly: monthly / 4.33
    return amount / 4.33;
  }
  
  // Already weekly
  return amount;
};