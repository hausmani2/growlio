# Profitability Score Components

This folder contains the components for the Profitability Score feature, which allows users to calculate their restaurant's profitability based on key financial metrics.

## Components

### 1. ProfitabilityScore.jsx
The landing page for the profitability score feature.

**Features:**
- Displays the Growlio logo
- Shows the main title "Ready to get your Profitability Score?"
- Lists the required information:
  - Last Month's Sales
  - Last Month's Cost of Goods (COGS)
  - Last Month's Labor Expense
  - Your Monthly Rent
- "Get My Score!" button to proceed to the form
- "What if I don't have this info?" link with modal

**Route:** `/profitability`

### 2. ProfitabilityWizard.jsx
4-step wizard UI where users enter amounts for:
- Last Month’s Sales
- Last Month’s Cost of Goods (COGS)
- Last Month’s Labor Expense
- Monthly Rent

**Features:**
- Big editable dollar amount (matches the screenshot style)
- Back/Next buttons
- Step dots + “Step X of 4”

**Route:** `/profitability/form`

## User Flow

1. User starts at `/onboarding` and selects "I have a restaurant. I would like a profitability score."
2. User clicks "Get Started" → navigates to `/profitability`
3. User reviews requirements and clicks "Get My Score!" → navigates to `/profitability/form`
4. User enters amounts across 4 steps → finishes (currently returns to `/profitability`)

## Scoring Logic

The profitability score is calculated based on industry standards:

### Cost of Goods (COGS)
- **Ideal:** 25-35% of sales
- **Warning:** 35-40%
- **Critical:** Above 40%

### Labor Cost
- **Ideal:** 25-35% of sales
- **Warning:** 35-40%
- **Critical:** Above 40%

### Rent
- **Ideal:** 5-10% of sales
- **Warning:** 10-15%
- **Critical:** Above 15%

### Score Calculation
- Starts at 100 points
- Deducts points for metrics outside ideal ranges
- Final score: 0-100

## Styling

All components follow the app's design system:
- Orange primary color (#FF8132)
- Consistent button styling
- Responsive layout (mobile-first)
- Two-column layout on desktop (content + image)
- Shadow and border radius for cards
- Ant Design components for UI elements

## Dependencies

- React Router (navigation)
- Ant Design (UI components, icons)
- Tailwind CSS (styling)
- GrowlioLogo component
- ImageLayout component

## Future Enhancements

- Save profitability score to user's dashboard
- Historical profitability tracking
- Comparison with industry benchmarks
- More detailed recommendations
- Integration with restaurant data from setup
- Export profitability report (PDF)

