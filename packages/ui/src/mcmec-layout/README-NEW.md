# MCMEC Layout - Compound Components

A flexible, composable layout system built with compound components pattern for React applications.

## Features

- **Compound Component Architecture**: Compose layout structure exactly as needed
- **Data Injection**: Apps provide their own data for breadcrumbs, sidebar content, and user info
- **Flexible Composition**: Use only the components you need
- **TypeScript Support**: Full type safety throughout
- **Backwards Compatible**: Legacy imports still work

## Installation

```tsx
import { Layout } from "@mcmec/ui/mcmec-layout";
```

## Basic Usage

```tsx
import { Layout } from "@mcmec/ui/mcmec-layout";
import { MySidebarContent } from "./MySidebarContent";

function App() {
  return (
    <Layout
      value={{
        apps: availableApps,
        activeApp: "My App",
        user: {
          name: "John Doe",
          title: "Developer",
          avatar: "/avatar.png",
        },
        onLogout: handleLogout,
      }}
    >
      <Layout.Sidebar>
        <Layout.Sidebar.Header>
          <Layout.AppSwitcher />
        </Layout.Sidebar.Header>
        <Layout.Sidebar.Content>
          <MySidebarContent />
        </Layout.Sidebar.Content>
        <Layout.Sidebar.Footer>
          <Layout.NavUser />
        </Layout.Sidebar.Footer>
      </Layout.Sidebar>
      
      <Layout.Content breadcrumb={<Layout.Breadcrumb items={breadcrumbItems} />}>
        <YourPageContent />
      </Layout.Content>
    </Layout>
  );
}
```

## Components

### Layout (Root)

The root component that provides context to all child components.

**Props:**
- `value`: Layout configuration object
  - `apps`: Array of available applications
  - `activeApp`: Name of the currently active app
  - `user`: User information object
    - `name`: User's full name
    - `title`: User's job title
    - `avatar`: URL to user's avatar image
  - `onLogout?`: Optional logout callback function

### Layout.Sidebar

The sidebar container with compound sub-components.

**Sub-components:**
- `Layout.Sidebar.Header`: Sidebar header area
- `Layout.Sidebar.Content`: Main sidebar content area
- `Layout.Sidebar.Footer`: Sidebar footer area

### Layout.Content

The main content area with optional breadcrumb support.

**Props:**
- `children`: Your page content
- `breadcrumb?`: Optional breadcrumb component

### Layout.AppSwitcher

Pre-built app switcher component that displays company logo, name, and app selector.

### Layout.NavUser

Pre-built user navigation component with avatar, name, and dropdown menu.

### Layout.Breadcrumb

Breadcrumb component for navigation.

**Props:**
- `items`: Array of breadcrumb items
  - `label`: Display text
  - `href?`: Optional link URL

## Complete Example

```tsx
import { Layout } from "@mcmec/ui/mcmec-layout";
import type { BreadcrumbPart } from "@mcmec/ui/mcmec-layout";

function MyApp() {
  const breadcrumbs: BreadcrumbPart[] = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings" }, // No href = current page
  ];

  return (
    <Layout
      value={{
        apps: [
          { name: "Central", href: "/central", logo: <CentralIcon /> },
          { name: "Public Notices", href: "/notices", logo: <NoticesIcon /> },
        ],
        activeApp: "Central",
        user: {
          name: "Jane Smith",
          title: "Administrator",
          avatar: "https://example.com/avatar.jpg",
        },
        onLogout: () => console.log("Logging out..."),
      }}
    >
      <Layout.Sidebar>
        <Layout.Sidebar.Header>
          <Layout.AppSwitcher />
        </Layout.Sidebar.Header>
        
        <Layout.Sidebar.Content>
          {/* Your custom sidebar navigation */}
          <nav>
            <a href="/dashboard">Dashboard</a>
            <a href="/settings">Settings</a>
          </nav>
        </Layout.Sidebar.Content>
        
        <Layout.Sidebar.Footer>
          <Layout.NavUser />
        </Layout.Sidebar.Footer>
      </Layout.Sidebar>
      
      <Layout.Content 
        breadcrumb={<Layout.Breadcrumb items={breadcrumbs} />}
      >
        <h1>My Page Content</h1>
        <p>This is where your app content goes.</p>
      </Layout.Content>
    </Layout>
  );
}
```

## Custom Implementations

You can create custom sidebar headers, footers, or content by not using the pre-built components:

```tsx
<Layout.Sidebar>
  <Layout.Sidebar.Header>
    {/* Your custom header */}
    <div>Custom Header</div>
  </Layout.Sidebar.Header>
  
  <Layout.Sidebar.Content>
    {/* Your custom navigation */}
    <CustomNavigation />
  </Layout.Sidebar.Content>
  
  <Layout.Sidebar.Footer>
    {/* Your custom footer */}
    <div>Custom Footer</div>
  </Layout.Sidebar.Footer>
</Layout.Sidebar>
```

## Breadcrumb Usage

Add breadcrumbs to your pages by passing them to the `Layout.Content` component:

```tsx
const breadcrumbs: BreadcrumbPart[] = [
  { label: "Home", href: "/" },
  { label: "Users", href: "/users" },
  { label: "Profile" }, // Current page (no href)
];

<Layout.Content breadcrumb={<Layout.Breadcrumb items={breadcrumbs} />}>
  <YourContent />
</Layout.Content>
```

## Migration from Legacy API

If you're using the old `LayoutProvider` + `LayoutSidebar` + `LayoutInset` pattern:

**Before:**
```tsx
<LayoutProvider apps={apps} activeApp="Central" user={user} onLogout={handleLogout}>
  <LayoutSidebar>
    <MySidebarContent />
  </LayoutSidebar>
  <LayoutInset>
    <Outlet />
  </LayoutInset>
</LayoutProvider>
```

**After:**
```tsx
<Layout value={{ apps, activeApp: "Central", user, onLogout: handleLogout }}>
  <Layout.Sidebar>
    <Layout.Sidebar.Header>
      <Layout.AppSwitcher />
    </Layout.Sidebar.Header>
    <Layout.Sidebar.Content>
      <MySidebarContent />
    </Layout.Sidebar.Content>
    <Layout.Sidebar.Footer>
      <Layout.NavUser />
    </Layout.Sidebar.Footer>
  </Layout.Sidebar>
  <Layout.Content>
    <Outlet />
  </Layout.Content>
</Layout>
```

## TypeScript Types

```tsx
import type { 
  LayoutContextData, 
  BreadcrumbPart 
} from "@mcmec/ui/mcmec-layout";

// LayoutContextData includes all configuration options
// BreadcrumbPart defines the shape of breadcrumb items
```

## Backwards Compatibility

Legacy exports are still available:
- `LayoutProvider` (alias for `LayoutRoot`)
- `LayoutInset` (alias for `LayoutContent`)
- Individual component exports

These will continue to work but are deprecated. Please migrate to the compound component pattern.
