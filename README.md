# Bannoidia E-Commerce App

E-commerce mobile application built with React Native and Expo.

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Install dependencies

```bash
npm install
# or
yarn install
```

2. Create `.env` file from `.env.example`

```bash
cp .env.example .env
```

3. Update environment variables with your API keys

### Development

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web

# Lint code
npm run lint
```

## Project Structure

See [APP_STRUCTURE.md](APP_STRUCTURE.md) for detailed project architecture.

```
bannoidia/
├── app/               # App screens and routing
├── components/        # Reusable components
├── context/          # React context providers
├── hooks/            # Custom hooks
├── services/         # API services
├── types/            # TypeScript types
├── utils/            # Utility functions
├── styles/           # Global styles
└── assets/           # Images, icons, fonts
```

## Key Features

- ✅ User Authentication
- ✅ Product Browsing & Search
- ✅ Shopping Cart
- ✅ Order Management
- ✅ User Profile
- ✅ Change Password
- ✅ Order Tracking

## Available Dependencies

### Navigation

- expo-router
- @react-navigation/native
- @react-navigation/bottom-tabs
- react-native-screens
- react-native-safe-area-context

### UI & Animations

- react-native-reanimated
- react-native-gesture-handler
- expo-glass-effect

### Networking

- axios

### Storage

- @react-native-async-storage/async-storage

### State Management

- Redux (to be installed)
- React Context API

## Scripts

```bash
npm start           # Start Expo development server
npm run ios         # Run on iOS
npm run android     # Run on Android
npm run web         # Run on Web
npm run lint        # Lint code
npm run reset-project  # Reset project
```

## Configuration

### API Configuration

Update `.env` file with your API base URL and version.

### Payment Gateway

Configure Stripe or PayPal keys in `.env`

### Firebase (Optional)

Add Firebase configuration in `.env` for analytics and push notifications

## Documentation

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Status

**Version:** 1.0.0  
**Status:** In Development  
**Last Updated:** April 1, 2026

## License

All rights reserved © 2026 Bannoidia
