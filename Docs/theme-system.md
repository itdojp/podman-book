# Theme System Documentation

## Overview

The Book Publishing Template includes a comprehensive theme system that allows you to customize the visual appearance of your book. Themes control colors, typography, layout, and component styling.

## Quick Start

### Using Built-in Themes

1. List available themes:
   ```bash
   npm run theme list
   ```

2. Set a theme:
   ```bash
   npm run theme set modern
   ```

3. Build with theme:
   ```bash
   npm run build:theme
   ```

### Preview Themes

Preview any theme before applying:
```bash
npm run theme preview classic
```

This generates an HTML preview file and opens it in your browser.

## Built-in Themes

### Modern Theme
Clean, contemporary design with focus on readability.
- **Style**: Sans-serif fonts, card-based layout
- **Colors**: Blue primary, light backgrounds
- **Best for**: Technical books, documentation

### Classic Theme
Traditional book design with serif fonts.
- **Style**: Serif typography, ornamental elements
- **Colors**: Brown/sepia tones, cream background
- **Best for**: Literature, academic texts

### Minimal Theme
Clean, distraction-free reading experience.
- **Style**: Minimal decoration, focus on content
- **Colors**: Black and white, high contrast
- **Best for**: Long-form reading, essays

### Academic Theme
Formal design suitable for academic papers.
- **Style**: Traditional academic formatting
- **Colors**: Navy blue, formal appearance
- **Best for**: Research papers, theses

### Magazine Theme
Dynamic magazine-style layout.
- **Style**: Grid layout, hero sections
- **Colors**: Vibrant, attention-grabbing
- **Best for**: Tutorials, visual content

## Theme Configuration

### In book-config.json

```json
{
  "theme": "modern",
  "themeOptions": {
    "modern": {
      "colors": {
        "primary": "#007bff",
        "secondary": "#6c757d"
      },
      "typography": {
        "fontFamily": "Inter, sans-serif",
        "baseFontSize": "18px"
      }
    }
  }
}
```

### Theme Customization

Create a `theme-custom.json` file:

```json
{
  "theme": "modern",
  "customizations": {
    "colors": {
      "primary": "#0066cc",
      "background": "#f8f9fa",
      "text": "#2c3e50"
    },
    "typography": {
      "fontFamily": "'Merriweather', serif",
      "baseFontSize": "17px",
      "lineHeight": "1.7"
    },
    "layout": {
      "maxWidth": "720px"
    }
  }
}
```

## Creating Custom Themes

### Create New Theme

```bash
npm run theme create my-custom-theme
```

This creates a theme template in `themes/my-custom-theme.js`.

### Theme Structure

```javascript
const { BaseTheme } = require('../scripts/theme-system');

class MyCustomTheme extends BaseTheme {
  constructor() {
    super();
    this.name = 'My Custom Theme';
    this.description = 'A custom theme for my book';
    
    this.defaultOptions = {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        textSecondary: '#6c757d',
        border: '#dee2e6',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
      },
      typography: {
        fontFamily: 'sans-serif',
        baseFontSize: '16px',
        lineHeight: '1.6'
      },
      layout: {
        maxWidth: '800px'
      }
    };
  }

  async generate(options) {
    const { colors, typography, layout } = options;
    
    return `
/* My Custom Theme */
${this.generateColorScheme(colors)}
${this.generateTypography(typography)}

/* Custom styles */
.container {
  max-width: ${layout.maxWidth};
}
    `;
  }
}

module.exports = MyCustomTheme;
```

## CSS Variables

Themes use CSS custom properties for easy customization:

### Color Variables
- `--color-primary`: Primary brand color
- `--color-secondary`: Secondary color
- `--color-background`: Page background
- `--color-surface`: Card/component background
- `--color-text`: Main text color
- `--color-text-secondary`: Secondary text
- `--color-border`: Border color
- `--color-success`: Success state
- `--color-warning`: Warning state
- `--color-error`: Error state

### Typography Variables
Defined in theme but can be overridden:
```css
:root {
  --font-family: -apple-system, sans-serif;
  --font-size-base: 16px;
  --line-height: 1.6;
}
```

## Dark Mode Support

Themes can include dark mode variants:

```javascript
async generateDarkMode(options) {
  return `
:root {
  --color-background: #121212;
  --color-surface: #1e1e1e;
  --color-text: #e0e0e0;
}
  `;
}
```

### Toggle Dark Mode

Add a toggle button to your layout:
```html
<button onclick="toggleTheme()">🌙</button>

<script>
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
</script>
```

## Responsive Design

Themes include responsive breakpoints:

```javascript
async generateResponsive(options) {
  return `
/* Tablet */
@media (max-width: 768px) {
  body { font-size: 15px; }
}

/* Mobile */
@media (max-width: 480px) {
  body { font-size: 14px; }
}
  `;
}
```

## Theme Components

### Standard Components

Themes style these components:
- Headers (h1-h6)
- Paragraphs and text
- Links
- Code blocks
- Blockquotes
- Tables
- Lists
- Cards
- Buttons

### Custom Components

Add custom components to your theme:

```css
/* Feature box */
.feature-box {
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  padding: 2rem;
  border-radius: 8px;
}

/* Alert */
.alert {
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
}

.alert-info {
  background: var(--color-info);
  color: white;
}
```

## Theme API

### ThemeSystem Class

```javascript
const { ThemeSystem } = require('./theme-system');

const themeSystem = new ThemeSystem();
await themeSystem.initialize(config);

// Set theme
themeSystem.setActiveTheme('modern');

// Generate CSS
const css = await themeSystem.generateCSS();

// Save theme
await themeSystem.saveTheme('theme.css');
```

### BaseTheme Methods

- `generate(options)`: Generate main CSS
- `generateDarkMode(options)`: Generate dark mode CSS
- `generateResponsive(options)`: Generate responsive CSS
- `generateColorScheme(colors)`: Generate color variables
- `generateTypography(typography)`: Generate typography styles

## Theme CLI Commands

```bash
# List themes
npm run theme list

# Show theme info
npm run theme info modern

# Set active theme
npm run theme set classic

# Preview theme
npm run theme preview minimal

# Create custom theme
npm run theme create my-theme

# Customize theme
npm run theme customize modern

# Export theme CSS
npm run theme export modern modern-theme.css
```

## Integration with Build System

### Using with Standard Build

```bash
# Build with configured theme
npm run build:theme
```

### Using with Other Build Scripts

Themes can be combined with other features:
```bash
# Build with plugins and theme
npm run build:plugins && npm run theme set modern
```

## Best Practices

### 1. Color Contrast
Ensure sufficient contrast for readability:
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum

### 2. Font Selection
Choose appropriate fonts:
- **Body text**: Readable at small sizes
- **Headings**: Clear hierarchy
- **Code**: Monospace with good character distinction

### 3. Responsive Design
- Test on multiple device sizes
- Use relative units (rem, em)
- Provide adequate touch targets

### 4. Performance
- Use system fonts when possible
- Minimize custom font weights
- Optimize CSS output

### 5. Accessibility
- Support dark mode
- Use semantic color names
- Provide focus indicators

## Troubleshooting

### Theme Not Applied

1. Check theme name in configuration
2. Verify theme CSS is generated
3. Check browser cache
4. Inspect CSS file loading

### Custom Theme Not Found

1. Ensure theme file is in correct location
2. Check file exports correct class
3. Verify theme extends BaseTheme

### Dark Mode Issues

1. Check CSS specificity
2. Verify dark mode media query
3. Test localStorage persistence

## Examples

### Company Brand Theme

```javascript
class CompanyTheme extends BaseTheme {
  constructor() {
    super();
    this.name = 'Company Brand';
    
    this.defaultOptions = {
      colors: {
        primary: '#ff6b6b',     // Brand red
        secondary: '#4ecdc4',   // Brand teal
        background: '#f7f7f7',
        text: '#2d3436'
      },
      typography: {
        fontFamily: '"Inter", sans-serif',
        headingFontFamily: '"Poppins", sans-serif'
      }
    };
  }
}
```

### High Contrast Theme

```javascript
class HighContrastTheme extends BaseTheme {
  constructor() {
    super();
    this.name = 'High Contrast';
    
    this.defaultOptions = {
      colors: {
        primary: '#000000',
        background: '#ffffff',
        text: '#000000',
        border: '#000000'
      }
    };
  }
}
```

## Future Enhancements

- Theme marketplace integration
- Visual theme editor
- Theme inheritance system
- Dynamic theme switching
- Theme performance metrics