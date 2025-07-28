# ShootCleaner Premium

A professional photography workflow application built with Electron, React, and TypeScript. Inspired by Aftershoot's premium design and user experience.

## Features

### 🎯 Core Functionality
- **Album Management**: Create and organize photo collections with professional grid layouts
- **AI-Powered Culling**: OpenAI Vision API integration for automated image analysis
- **Batch Processing**: ImageMagick pipeline for professional enhancement
- **Professional UI**: Aftershoot-inspired dark theme with premium styling

### 🚀 Workflow Stages
1. **Import**: Drag-and-drop RAW/JPEG support with session management
2. **Cull**: AI analysis with keep/reject/review decisions and confidence scoring
3. **Edit**: Batch editing with AI-provided enhancement commands
4. **Retouch**: Professional retouching tools and filters

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron (cross-platform)
- **Build Tool**: Vite (fast development)
- **Styling**: Tailwind CSS + custom professional.css
- **State Management**: React Query (@tanstack/react-query)
- **UI Components**: Headless UI with custom styling
- **Icons**: Lucide React
- **AI Integration**: OpenAI SDK with Assistant API

## Development

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run Electron in development
npm run electron:dev

# Build for production
npm run build:electron
```

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
