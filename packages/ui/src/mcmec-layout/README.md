# MCMEC Layout Components

A comprehensive, shared layout system for MCMEC applications built with React and shadcn/ui components.

## Overview

This layout provides a consistent user experience across all MCMEC applications with:
- Collapsible sidebar navigation
- Company branding and app switcher
- User profile menu with logout functionality
- Breadcrumb navigation
- Error boundary protection
- Responsive design for mobile and desktop

## Components

### `LayoutProvider`

The root component that provides context and wraps all layout components.

**Props:**
- `children` (ReactNode) - The application content
- `companyLogoUrl` (string) - URL to the company logo
- `companyName` (string) - Name of the company
- `apps` (Array<App>) - List of available applications
- `activeApp` (string) - Name of the currently active application
- `user` (object) - User information
  - `name` (string) - User's full name
  - `title` (string) - User's job title/role
  - `avatar` (string) - URL to user's avatar image
- `onLogout?` (function) - Callback function when user clicks logout

### `LayoutSidebar`

Wraps the sidebar navigation content provided by consuming applications.

**Props:**
- `children?` (ReactNode) - Custom sidebar navigation content
- Accepts all props from shadcn/ui `Sidebar` component

### `LayoutInset`

Wraps the main content area, typically containing the application's router outlet.

**Props:**
- `children` (ReactNode) - Main application content (usually `<Outlet />`)

### `LayoutBreadcrumb`

Displays breadcrumb navigation based on provided items.

**Props:**
- `items` (Array<BreadcrumbItem>) - Breadcrumb items to display
  - `label` (string) - Text to display
  - `href?` (string) - Optional link URL (omit for current page)

## Installation

This package is part of the `@mcmec/ui` monorepo package. Ensure you have the following dependencies:

```json
{
  "dependencies": {
    "@mcmec/ui": "workspace:*",
    "@mcmec/lib": "workspace:*"
  }
}
```

## Usage

### Basic Setup

```tsx
import { LayoutProvider, LayoutSidebar, LayoutInset } from '@mcmec/ui/mcmec-layout';
import { Outlet } from '@tanstack/react-router';

function App() {
  const apps = [
    {
      name: 'Central',
      logo: <LayoutDashboard />,
      description: 'Main dashboard',
      href: '/central',
      requiredPermission: null
    },
    // ... more apps
  ];

  const handleLogout = async () => {
    // Your logout logic
    await signOut();
  };

  return (
    <LayoutProvider
      companyLogoUrl="/logo.png"
      companyName="MCMEC"
      apps={apps}
      activeApp="Central"
      user={{
        name: "John Doe",
        title: "Administrator",
        avatar: "/avatars/john.jpg"
      }}
      onLogout={handleLogout}
    >
      <LayoutSidebar>
        {/* Your custom sidebar navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* More menu items */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </LayoutSidebar>

      <LayoutInset>
        <Outlet />
      </LayoutInset>
    </LayoutProvider>
  );
}
```

### Using Breadcrumbs

```tsx
import { LayoutBreadcrumb } from '@mcmec/ui/mcmec-layout';

function MyPage() {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Settings', href: '/settings' },
    { label: 'Profile' } // Current page (no href)
  ];

  return (
    <div>
      <LayoutBreadcrumb items={breadcrumbs} />
      {/* Page content */}
    </div>
  );
}
```

### Customizing Sidebar Content

The `LayoutSidebar` component provides a wrapper with fixed header (app switcher) and footer (user menu). You can add your application-specific navigation in between:

```tsx
<LayoutSidebar>
  <SidebarGroup>
    <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link to="/">
              <Home />
              <span>Home</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {/* More items */}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>

  <SidebarGroup>
    <SidebarGroupLabel>Admin</SidebarGroupLabel>
    {/* More content */}
  </SidebarGroup>
</LayoutSidebar>
```

## App Type Definition

Applications are defined using the `App` type from `@mcmec/lib/constants/apps`:

```tsx
type App = {
  name: string;              // Display name
  logo: React.ReactNode;     // Icon/logo component
  description: string;       // App description
  href: string;             // URL to navigate to (e.g., '/central')
  requiredPermission: string | null;  // Permission required or null for public
};
```

## Features

### App Switcher
- Displays company logo and name
- Shows current active application
- Dropdown menu to switch between available apps
- Apps are filtered based on user permissions
- Navigates using anchor tags for cross-subdomain navigation

### User Menu
- Displays user avatar with fallback initials (e.g., "JD" for John Doe)
- Shows user name and title
- Logout functionality via callback
- Placeholder for Account and Notifications (disabled by default)

### Responsive Design
- Sidebar collapses to icon-only mode
- Mobile-friendly dropdown positioning
- Adaptive layouts for different screen sizes

### Error Boundary
- Catches and handles layout errors gracefully
- Provides fallback UI with reload option
- Prevents entire app crashes

## Styling

The components use Tailwind CSS with shadcn/ui design tokens. Ensure your consuming application has:
- Tailwind CSS configured
- shadcn/ui theme setup
- Required CSS variables defined

## TypeScript Support

All components are fully typed with TypeScript. Import types as needed:

```tsx
import type { BreadcrumbItem } from '@mcmec/ui/mcmec-layout/layout-breadcrumb';
import type { LayoutContextData } from '@mcmec/ui/mcmec-layout/layout-context';
```

## Accessing Layout Context

If you need to access layout data in nested components:

```tsx
import { useLayoutContext } from '@mcmec/ui/mcmec-layout/layout-context';

function MyComponent() {
  const { user, activeApp, apps } = useLayoutContext();
  
  return <div>Current app: {activeApp}</div>;
}
```

## Local Development Notes

The app switcher uses anchor tags (`<a href>`) for navigation between apps. In local development, these links may not work correctly as they expect proper subdomain/domain structure. In production with correct domain setup, navigation between apps will work seamlessly.

## Best Practices

1. **Logout Handling**: Always provide an `onLogout` callback that properly clears session data
2. **Avatar Images**: Provide avatar URLs when available; the component automatically generates initials as fallback
3. **Permissions**: Use the `requiredPermission` field in apps to control access
4. **Breadcrumbs**: Keep breadcrumb trails concise (3-5 items max)
5. **Sidebar Content**: Keep sidebar navigation organized with `SidebarGroup` components

## Example: Complete Implementation

```tsx
// app.tsx
import { LayoutProvider, LayoutSidebar, LayoutInset } from '@mcmec/ui/mcmec-layout';
import { AVAILABLE_APPS } from '@mcmec/lib/constants/apps';
import { Outlet, Link } from '@tanstack/react-router';
import { signOut } from '@mcmec/supabase/auth';

function RootLayout() {
  const user = {
    name: "Jane Smith",
    title: "Manager",
    avatar: "https://example.com/avatar.jpg"
  };

  return (
    <LayoutProvider
      companyLogoUrl="/logo.svg"
      companyName="MCMEC"
      apps={AVAILABLE_APPS}
      activeApp="Central"
      user={user}
      onLogout={signOut}
    >
      <LayoutSidebar>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <Home />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </LayoutSidebar>

      <LayoutInset>
        <Outlet />
      </LayoutInset>
    </LayoutProvider>
  );
}
```

## Troubleshooting

### Context Error
If you see "useLayoutContext must be used within LayoutContextProvider", ensure your component is rendered inside `<LayoutProvider>`.

### Avatar Not Showing
Check that the avatar URL is accessible. The component will automatically show user initials as fallback.

### Sidebar Not Collapsing
Ensure you're using the `SidebarTrigger` component (included in `LayoutInset` header by default).

## License

Internal use only - MCMEC organization.
