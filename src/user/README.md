# Svelte 5 Capacitor Google Auth User

A reactive User class for Svelte 5 apps, providing seamless Google authentication via Capacitor. Supports both native (iOS/Android) and web platforms.

## Features
- Google sign-in/out for Svelte 5 apps
- Works with Capacitor (native) and browser (web)
- Reactive user state using Svelte 5's $state
- TypeScript support with strong typings
- User data persistence via @capacitor/preferences

## Installation

1. 
```
git submodule add git@github.com:tertius4/user.git <path-to-submodule>
```

2. For native platforms, ensure Capacitor is set up in your project:

```bash
npx cap init
npx cap add android # or ios
```

3. Configure your Google OAuth client IDs in the Google Developer Console and set them in your app.

## Usage

### 1. Import and Initialize

```ts
import { User } from '<your-library-name>';

const user = new User('<YOUR_GOOGLE_CLIENT_ID>');
```

### 2. Sign In

```ts
const result = await user.signIn();
if (result.success) {
  // user.name, user.email_address, etc. are now reactive
} else {
  console.error(result.error_message);
}
```

### 3. Sign Out

```ts
await user.signOut();
```

### 4. Accessing User State

User properties are reactive ($state):

```ts
console.log(user.name); // Svelte reactive
```

## For Whom?
- Svelte 5 developers building apps with Google authentication
- Projects using Capacitor for cross-platform (web + native) support
- TypeScript users who want strong typing and modern tooling

## Requirements
- Svelte 5+
- Capacitor 8+
- Google OAuth client ID (from Google Developer Console)

## License
MIT
