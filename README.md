# Talwit - Study & Wellness Companion

An AI-powered study & wellness companion app built with React and Vite.

## Features

- **Home Dashboard** - View today's study session, tasks, habits, and mood
- **Minimalistic iPhone UI** - iOS 16 glassy design with calm aesthetic
- **Primary Color**: #66DCDC

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
  ├── pages/
  │   └── HomePage.jsx      # Main dashboard/homepage
  ├── App.jsx               # Root component
  ├── main.jsx              # Entry point
  └── index.css             # Global styles
```

## Design System

- **Primary Color**: #66DCDC
- **Style**: Minimal, glassy iOS 16 look
- **Spacing**: Large, comfortable spacing
- **Border Radius**: 20px for cards, 12px for buttons
- **Typography**: System fonts (-apple-system)

## Next Steps

Based on the MVP requirements, the following features need to be implemented:

1. Survey-first onboarding
2. Account creation (Auth)
3. AI-generated personalized plan
4. Schedule system
5. AI chatbot
6. Settings page
