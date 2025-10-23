# Firebase Authentication & Credit System

This document explains the Firebase-based authentication and credit system implemented in the Angel application.

## Overview

The Angel application now includes a comprehensive authentication and credit system that:
- Manages user authentication via Firebase Auth
- Tracks credit usage for AI interactions
- Provides seamless integration with the existing application flow
- Handles offline scenarios gracefully

## Features

### Authentication
- **Email/Password Authentication**: Users can sign up and sign in with email and password
- **Google Sign-In**: One-click authentication with Google accounts
- **User Profile Management**: Display name, email, and profile picture support
- **Persistent Sessions**: Users remain logged in across browser sessions

### Credit System
- **Initial Credits**: New users receive 10 free credits upon signup
- **Credit Costs**:
  - Text responses: 1 credit per AI response
  - Image analysis: 4 credits per AI response (screenshot analysis)
- **Real-time Balance**: Credit balance is displayed in the UI and updated in real-time
- **Credit Exhaustion Handling**: Users are redirected to upgrade when credits are exhausted

### Database Structure

```
users (collection)
└── {userId} (document)
    └── subscription (subcollection)
        └── credits (document)
            ├── credits: number
            ├── lastUpdated: timestamp
            ├── createdAt: timestamp
            └── lastUsage: object
                ├── cost: number
                ├── type: 'text' | 'image'
                └── timestamp: timestamp
```

## Implementation Details

### Core Components

1. **AuthContext** (`contexts/AuthContext.tsx`)
   - Provides authentication state and methods throughout the app
   - Manages credit balance and consumption
   - Handles Firebase Auth state changes

2. **CreditService** (`lib/creditService.ts`)
   - Singleton service for credit management
   - Handles local credit tracking and Firebase synchronization
   - Provides offline support with local storage fallback

3. **Authentication Components**:
   - `AuthModal`: Login/signup modal with email and Google authentication
   - `UserProfile`: User profile dropdown with credit display and logout
   - `CreditDisplay`: Shows current credit balance with refresh option
   - `CreditsExhaustedModal`: Upgrade prompt when credits are exhausted

### Credit Consumption Flow

1. **User Action**: User initiates an AI request (text or image)
2. **Authentication Check**: Verify user is logged in
3. **Credit Check**: Verify user has sufficient credits
4. **Local Deduction**: Immediately deduct credits locally for responsive UI
5. **API Request**: Proceed with the AI request
6. **Firebase Update**: Asynchronously update Firebase with new credit balance

### Offline Support

- Credits are cached locally using localStorage
- When offline, credit deductions are tracked locally
- When back online, local and Firebase credits are synchronized
- Uses minimum of local and Firebase credits to prevent exploitation

## Configuration

### Firebase Setup

The Firebase configuration is already included in the code:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBbkWQtKbFH7k_c_d6QuJM_FuPtODftfno",
  authDomain: "lazy-job-seeker-4b29b.firebaseapp.com",
  projectId: "lazy-job-seeker-4b29b",
  storageBucket: "lazy-job-seeker-4b29b.firebasestorage.app",
  messagingSenderId: "275448735352",
  appId: "1:275448735352:web:342f6eeb6012f35b81af8d",
  measurementId: "G-PCYRPW12BW"
};
```

### Required Firebase Services

1. **Authentication**: Enable Email/Password and Google providers
2. **Firestore**: Set up database with appropriate security rules
3. **Analytics**: Optional, for usage tracking

### Security Rules

Recommended Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subscription subcollection
      match /subscription/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Usage

### For Users

1. **Getting Started**: Users can sign up with email or Google account
2. **Free Credits**: New users automatically receive 10 free credits
3. **Using Angel**: Each text response costs 1 credit, image analysis costs 4 credits
4. **Upgrading**: When credits are exhausted, users are directed to the pricing page

### For Developers

1. **Authentication State**: Use the `useAuth()` hook to access user and credit state
2. **Credit Consumption**: Use `consumeCredits(cost, isImageRequest)` before API calls
3. **Credit Checking**: Use `hasCredits(cost)` to check if user can afford an action
4. **UI Updates**: Credit balance updates automatically in all components

## Error Handling

- **Network Errors**: Graceful fallback to local credit tracking
- **Authentication Errors**: Clear error messages in the auth modal
- **Credit Exhaustion**: Friendly upgrade prompts with clear pricing information
- **Firebase Errors**: Console logging with user-friendly fallbacks

## Mobile Optimization

- Touch-friendly authentication modals
- Responsive credit display
- Mobile-optimized user profile dropdown
- Seamless integration with mobile voice recording flow

## Security Considerations

- Client-side credit deduction for responsive UI
- Server-side validation should be implemented for production
- Atomic transactions prevent race conditions
- Local/Firebase credit synchronization prevents exploitation
- Secure Firebase rules restrict access to user's own data

## Future Enhancements

- Subscription management
- Credit purchase flow
- Usage analytics
- Admin dashboard for credit management
- Webhook integration for payment processing
