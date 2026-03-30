# Survivor OutDraft - Frontend

A unified mobile and web application for the Survivor OutDraft game, built with Expo and React Native.

## 🎯 Project Overview

This app provides:
- **Mobile Player Experience**: Native mobile app for game night participants (iOS/Android via Expo Go)
- **Web Player Experience**: Accessible web version for broader reach
- **Admin Dashboard**: Web-optimized management interface

## 🏗️ Architecture

Single Expo project with:
- **Expo Router**: File-based routing with route groups
- **Conditional UI**: Platform-specific optimizations
- **Shared Codebase**: Maximum code reuse across targets

### Folder Structure

```
survivor-outdraft-frontend/
├── app/                      # Expo Router pages
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Entry point (routing logic)
│   ├── (player)/            # Mobile-optimized screens
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── (admin)/             # Web-optimized admin
│       ├── _layout.tsx
│       └── index.tsx
├── components/              # Reusable components
│   ├── player/             # Player-specific components
│   ├── admin/              # Admin-specific components
│   └── shared/             # Shared components
├── services/               # API clients
│   └── api.ts             # Backend integration
├── types/                  # TypeScript definitions
│   └── survivor.ts
├── constants/              # App-wide constants
│   └── theme.ts
└── assets/                # Images, fonts, etc.
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (installed via npx)
- [Expo Go app](https://expo.dev/go) on your phone (for mobile testing)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Running the App

#### Mobile (Expo Go)
```bash
npm start
# Scan QR code with Expo Go app (iOS/Android)
```

#### Web
```bash
npm run web
# Opens at http://localhost:8081
```

#### iOS Simulator (Mac only)
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

## 🎮 Usage

### Player View (Default)
- Opens automatically on mobile devices
- Access at: `http://localhost:8081/`
- Mobile-optimized interface for game participation

### Admin Dashboard
- Web-only recommended
- Access at: `http://localhost:8081/admin`
- Desktop-optimized management interface

## 🔌 Backend Integration

The app connects to the Spring Boot backend:
- **Development**: `http://localhost:8080/api`
- **Production**: Set `EXPO_PUBLIC_API_BASE_URL` (fallback: `API_BASE_URL`)

Make sure your Spring Boot server is running on port 8080.

### API URL Rules

API URL resolution is centralized in `services/api.ts`:
- If `NODE_ENV` is development (or unset), frontend uses `http://localhost:8080/api`
- Otherwise, frontend uses `EXPO_PUBLIC_API_BASE_URL` (or `API_BASE_URL`)

## 📱 Deployment

### Web Deployment
```bash
# Build for web
npx expo export -p web

# Deploy static files to Netlify, Vercel, etc.
```

### Mobile App Stores (Future)
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🛠️ Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Navigation**: Expo Router v6
- **Language**: TypeScript
- **Styling**: StyleSheet API
- **State Management**: React Hooks (expand as needed)
- **Backend**: Spring Boot REST API

## 📝 Development Notes

### Adding New Routes

**Player Route:**
Create file in `app/(player)/your-screen.tsx`

**Admin Route:**
Create file in `app/(admin)/your-screen.tsx`

### Platform-Specific Code
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-only code
} else {
  // Mobile-only code
}
```

## 🔐 Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_API_BASE_URL=https://your-production-api.example.com/api
```

Notes:
- In development, the app always targets `http://localhost:8080/api`
- In production builds, set `EXPO_PUBLIC_API_BASE_URL` (or `API_BASE_URL`) to your deployed backend

## 📄 License

Private project

## 👥 Contributors

Built for Survivor game nights! 🔥
