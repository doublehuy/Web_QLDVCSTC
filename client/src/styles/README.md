# Pet Care Management - CSS System

Hệ thống CSS hoàn chỉnh cho ứng dụng Pet Care Management với thiết kế hiện đại, responsive và dễ sử dụng.

## Cấu trúc thư mục

```
src/styles/
├── components.css    # Styles cho các component chính
├── forms.css         # Styles cho forms và input
├── admin.css         # Styles cho trang admin
├── utilities.css     # Utility classes
└── README.md         # Hướng dẫn sử dụng
```

## CSS Variables

Hệ thống sử dụng CSS custom properties để quản lý màu sắc, spacing và các giá trị khác:

### Colors
- **Primary**: `--primary-50` đến `--primary-900`
- **Secondary**: `--secondary-50` đến `--secondary-900`
- **Accent**: `--accent-pink`, `--accent-green`, `--accent-yellow`, `--accent-red`, `--accent-purple`
- **Status**: `--status-pending`, `--status-confirmed`, `--status-completed`, etc.

### Spacing
- `--spacing-xs`: 0.25rem
- `--spacing-sm`: 0.5rem
- `--spacing-md`: 1rem
- `--spacing-lg`: 1.5rem
- `--spacing-xl`: 2rem
- `--spacing-2xl`: 3rem

### Border Radius
- `--radius-sm`: 0.375rem
- `--radius-md`: 0.5rem
- `--radius-lg`: 0.75rem
- `--radius-xl`: 1rem
- `--radius-full`: 9999px

### Shadows
- `--shadow-sm`: Shadow nhẹ
- `--shadow-md`: Shadow trung bình
- `--shadow-lg`: Shadow mạnh
- `--shadow-xl`: Shadow rất mạnh

### Transitions
- `--transition-fast`: 0.15s ease
- `--transition-normal`: 0.3s ease
- `--transition-slow`: 0.5s ease

## Component Classes

### Buttons
```html
<!-- Button variants -->
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-success">Success Button</button>
<button class="btn btn-danger">Danger Button</button>
<button class="btn btn-outline">Outline Button</button>
<button class="btn btn-ghost">Ghost Button</button>

<!-- Button sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Medium</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-xl">Extra Large</button>
```

### Cards
```html
<!-- Basic card -->
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-body">
    Card content
  </div>
  <div class="card-footer">
    Card footer
  </div>
</div>

<!-- Card variants -->
<div class="card card-elevated">Elevated card</div>
<div class="card card-flat">Flat card</div>
<div class="card card-gradient">Gradient card</div>
<div class="card card-interactive">Interactive card</div>
```

### Forms
```html
<!-- Form group -->
<div class="form-group">
  <label class="form-label">Label</label>
  <input class="form-input" type="text" placeholder="Input">
  <p class="form-error">Error message</p>
</div>

<!-- Form variants -->
<input class="form-input error" type="text">
<input class="form-input" type="text" disabled>
<select class="form-select">
<textarea class="form-textarea"></textarea>

<!-- Input with icon -->
<div class="input-group">
  <input class="form-input" type="text">
  <div class="input-group-append">
    <Icon />
  </div>
</div>
```

### Status Badges
```html
<span class="status-badge status-pending">Pending</span>
<span class="status-badge status-confirmed">Confirmed</span>
<span class="status-badge status-in-progress">In Progress</span>
<span class="status-badge status-completed">Completed</span>
<span class="status-badge status-cancelled">Cancelled</span>
```

### Loading Spinner
```html
<!-- Different sizes -->
<div class="spinner spinner-sm"></div>
<div class="spinner"></div>
<div class="spinner spinner-lg"></div>
<div class="spinner spinner-xl"></div>

<!-- Loading overlay -->
<div class="loading-overlay">
  <div class="loading-container">
    <div class="spinner"></div>
    <p class="loading-text">Loading...</p>
  </div>
</div>
```

## Layout Classes

### Page Structure
```html
<div class="layout-container">
  <div class="sidebar">
    <div class="sidebar-brand">
      <Icon class="sidebar-brand-icon" />
      <span class="sidebar-brand-text">Brand</span>
    </div>
    <nav class="sidebar-nav">
      <a class="sidebar-nav-item active">
        <Icon class="sidebar-nav-icon" />
        Menu Item
      </a>
    </nav>
  </div>
  
  <div class="top-bar">
    <div class="top-bar-content">
      <h1 class="top-bar-title">Page Title</h1>
      <div class="top-bar-user">
        <div class="user-info">
          <p class="user-name">User Name</p>
          <p class="user-email">user@email.com</p>
        </div>
        <div class="user-actions">
          <button class="user-action-btn">Action</button>
        </div>
      </div>
    </div>
  </div>
  
  <main class="main-content">
    <div class="page-header">
      <h1 class="page-title">Page Title</h1>
      <p class="page-subtitle">Page subtitle</p>
    </div>
    <!-- Page content -->
  </main>
</div>
```

### Admin Components
```html
<!-- Admin header -->
<div class="admin-header">
  <div class="admin-header-content">
    <h1 class="admin-title">Admin Dashboard</h1>
    <p class="admin-subtitle">Manage your application</p>
  </div>
</div>

<!-- Stats grid -->
<div class="admin-stats-grid">
  <div class="admin-stat-card">
    <div class="admin-stat-header">
      <div class="admin-stat-title">Total Users</div>
      <div class="admin-stat-icon">
        <Icon />
      </div>
    </div>
    <div class="admin-stat-value">1,234</div>
    <div class="admin-stat-change positive">
      <Icon />
      <span>+12% from last month</span>
    </div>
  </div>
</div>

<!-- Admin table -->
<div class="admin-table-container">
  <div class="admin-table-header">
    <h3 class="admin-table-title">Data Table</h3>
    <div class="admin-table-actions">
      <button class="btn btn-primary btn-sm">Add New</button>
    </div>
  </div>
  <table class="admin-table">
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
        <td>
          <div class="table-actions">
            <button class="table-action-btn edit">Edit</button>
            <button class="table-action-btn delete">Delete</button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## Animation Classes

### Entrance Animations
```html
<div class="fade-in">Fade in animation</div>
<div class="slide-in-left">Slide in from left</div>
<div class="slide-in-right">Slide in from right</div>
<div class="scale-in">Scale in animation</div>
<div class="bounce-in">Bounce in animation</div>
```

### Hover Effects
```html
<div class="hover-lift">Lifts on hover</div>
<div class="hover-scale">Scales on hover</div>
<div class="hover-glow">Glows on hover</div>
```

## Utility Classes

### Spacing
```html
<div class="p-3 m-2">Padding 3, Margin 2</div>
<div class="mt-4 mb-2">Margin top 4, margin bottom 2</div>
```

### Text
```html
<p class="text-lg font-bold text-center">Large, bold, centered text</p>
<p class="text-primary">Primary colored text</p>
```

### Display
```html
<div class="flex items-center justify-between">Flexbox layout</div>
<div class="grid grid-cols-3 gap-4">Grid layout</div>
<div class="hidden md:block">Hidden on mobile, visible on desktop</div>
```

### Colors
```html
<div class="bg-primary text-white">Primary background</div>
<div class="bg-success-light text-success">Success themed</div>
```

## Responsive Design

Hệ thống CSS hỗ trợ responsive design với các breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Responsive Classes
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 1 column on mobile, 2 on tablet, 3 on desktop -->
</div>

<div class="text-sm md:text-base lg:text-lg">
  <!-- Responsive text sizes -->
</div>

<div class="hidden md:block">
  <!-- Hidden on mobile, visible on tablet and up -->
</div>
```

## Best Practices

1. **Sử dụng CSS Variables**: Luôn sử dụng CSS custom properties thay vì hardcode values
2. **Component-first**: Sử dụng component classes trước khi tạo custom styles
3. **Responsive**: Luôn thiết kế mobile-first
4. **Consistent**: Sử dụng spacing và color system nhất quán
5. **Performance**: Tránh tạo quá nhiều custom classes không cần thiết

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Customization

Để customize theme, chỉ cần thay đổi các CSS variables trong `:root`:

```css
:root {
  --primary-500: #your-color;
  --spacing-md: 1.5rem;
  /* ... other variables */
}
```
