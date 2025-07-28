# ShootCleaner Premium - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is ShootCleaner Premium - a professional photography workflow application built with Electron + React + TypeScript, inspired by Aftershoot's premium design and user experience.

## Architecture Guidelines
- **Frontend**: React 18 + TypeScript with Vite build tool
- **Desktop**: Electron for cross-platform desktop functionality
- **Styling**: Tailwind CSS with custom professional.css for Aftershoot-inspired theme
- **State Management**: React Query (@tanstack/react-query) for server state
- **UI Components**: Headless UI components with custom styling
- **Icons**: Lucide React for consistent iconography
- **AI Integration**: OpenAI SDK with Assistant API for image analysis

## Design System
- **Theme**: Dark professional theme (#181A1B background, #2176FF primary, #19C9C2 accent)
- **Typography**: Inter font family for professional appearance
- **Colors**: Use CSS custom properties for consistent theming
- **Spacing**: 24px outer margins, 16px gutters, 12px grid spacing, 8px border radius
- **Components**: Sharp corners (8px), subtle shadows, smooth animations

## Key Features to Implement
1. **Installer/Onboarding Flow**: Capcut-style animated installer with licence activation
2. **Dashboard**: Album/project management with professional grid layout
3. **Image Import**: Drag-and-drop with RAW/JPEG support and session management
4. **AI Culling**: OpenAI Vision API integration for automated image analysis
5. **Batch Processing**: ImageMagick pipeline for professional enhancement
6. **Gallery System**: Professional culling interface with bulk operations

## Code Standards
- Use TypeScript strict mode with proper type definitions
- Implement proper error handling with user-friendly error messages
- Follow React best practices with hooks and functional components
- Use React Query for all API interactions and state management
- Implement proper loading states and error boundaries
- Write modular, reusable components following single responsibility principle

## OpenAI Integration
- Assistant ID: asst_qGplgwIGY48tQ2vk44kXSVCH
- Use for batch image analysis with vision API
- Return structured analysis results with confidence scoring and rationale
- Implement proper error handling for API rate limits and failures

## Performance Considerations
- Use virtualization for large image galleries (react-window)
- Implement proper image lazy loading and optimization
- Use Web Workers for heavy processing tasks
- Optimize Electron main/renderer process communication
- Implement proper memory management for large image sets

## File Structure
Follow the established src/ structure with components/, services/, hooks/, styles/, types/, and utils/ directories. Keep components modular and focused on single responsibilities.
