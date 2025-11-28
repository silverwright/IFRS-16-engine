# Dark Mode Implementation Guide

## Overview

Dark mode has been successfully implemented for your Lease-Engine application. Users can now switch between light and dark themes with persistent storage.

## What's Been Added

### 1. **Theme Context** (`src/context/ThemeContext.tsx`)

- Manages theme state (light/dark)
- Persists theme preference to localStorage
- Respects system preference on first visit
- Provides `useTheme()` hook for accessing/toggling theme

### 2. **Tailwind Configuration** (`tailwind.config.js`)

- Enabled dark mode with `darkMode: 'class'`
- This allows class-based dark mode switching

### 3. **App Component** (`src/App.tsx`)

- Wrapped with `ThemeProvider`
- Added dark mode background and text color classes

### 4. **Header Component** (`src/components/Layout/Header.tsx`)

- Added theme toggle button with Moon/Sun icons
- Updated all colors with dark mode variants
- Navigation and dropdowns now support dark mode

### 5. **UI Components**

- **Button** (`src/components/UI/Button.tsx`): Updated all variants with dark mode support
- **Home Page** (`src/pages/Home.tsx`): Updated all sections with dark mode styling

## How It Works

### Features

1. **Toggle Button**: Click the Moon/Sun icon in the header to switch themes
2. **Persistent**: Theme preference is saved in localStorage
3. **System Preference**: First-time users automatically get their system preference
4. **Smooth Transitions**: All colors have smooth transitions between themes

### Using Dark Mode in Components

To use dark mode in your components, use Tailwind's `dark:` prefix:

```tsx
// Light mode | Dark mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

### Dark Mode Prefixes Reference

- `dark:bg-gray-900` - Dark background
- `dark:text-white` - Light text on dark
- `dark:border-gray-700` - Dark borders
- `dark:hover:bg-gray-800` - Dark hover states
- `dark:focus:ring-blue-400` - Dark focus states

## Color Palette Used

### Light Mode

- Background: `white` (#FFFFFF)
- Text: `slate-900` (dark gray)
- Borders: `slate-200`
- Accents: `blue-600`

### Dark Mode

- Background: `gray-950/gray-900` (very dark)
- Text: `white`
- Borders: `gray-700`
- Accents: `blue-400/blue-500`

## Next Steps for Other Components

To add dark mode to other components in your app:

1. Replace color classes with `dark:` variants
2. Examples:

   ```tsx
   // Before
   className = "bg-slate-50 text-slate-900 border border-slate-200";

   // After
   className =
     "bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white border border-slate-200 dark:border-gray-700";
   ```

3. Test both light and dark modes by clicking the toggle button

## Files Modified

- ✅ `src/context/ThemeContext.tsx` (created)
- ✅ `tailwind.config.js`
- ✅ `src/App.tsx`
- ✅ `src/components/Layout/Header.tsx`
- ✅ `src/components/UI/Button.tsx`
- ✅ `src/pages/Home.tsx`

## Testing

1. Start your development server: `npm run dev`
2. Click the Moon/Sun icon in the top right corner
3. Theme should switch smoothly
4. Refresh the page - theme preference should persist
5. Close and reopen the browser - theme should still be remembered
