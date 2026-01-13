# GrowlioLogo Component

A reusable SVG logo component for the Growlio application.

## Usage

```jsx
import GrowlioLogo from '../common/GrowlioLogo';

// Full logo with square and text
<GrowlioLogo width={120} height={40} />

// Icon only (orange square)
<GrowlioLogo width={32} height={32} iconOnly={true} />

// Logo without text
<GrowlioLogo width={120} height={32} showText={false} />

// With custom classes
<GrowlioLogo width={120} height={40} className="mx-auto mb-4" />
```

## Props

- `width` (number): Width of the logo in pixels
- `height` (number): Height of the logo in pixels  
- `className` (string): Additional CSS classes
- `showText` (boolean): Whether to show the "Growlio" text (default: true)
- `iconOnly` (boolean): Show only the orange square icon (default: false)

## Features

- **Scalable SVG**: Crisp at any size
- **Customizable**: Adjust width, height, and styling
- **Flexible**: Can show full logo, text only, or icon only
- **Consistent**: Same design across all components
- **Performance**: No image loading, pure SVG

## File Structure

- `GrowlioLogo.jsx` - Main component
- `growlio-logo.svg` - Full logo SVG
- `growlio-favicon.svg` - Favicon version

## Colors

- **Orange Square**: `#FF8132` (brand color)
- **Text**: `#FF8132` (brand orange color)
- **Background**: Transparent

## Design

- **Icon**: Rounded orange square block
- **Typography**: Clean, modern sans-serif font
- **Style**: Square + text combination
- **Layout**: Balanced design with proper spacing
