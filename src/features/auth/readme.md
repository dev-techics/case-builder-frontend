# Auth Feature

Cookie-based authentication system for the Case Builder application using Laravel Sanctum.

## Features

- ✅ User registration with validation
- ✅ Email and password login
- ✅ HttpOnly cookie-based authentication
- ✅ Protected routes
- ✅ Auto-fetch user on app load
- ✅ User dropdown with logout
- ✅ Error handling and loading states
- ✅ Responsive auth layout

## File Structure

```
features/auth/
├── components/
│   ├── AuthLayout.tsx          # Layout wrapper for auth pages
│   ├── LoginForm.tsx            # Login form component
│   ├── RegisterForm.tsx         # Registration form component
│   ├── ProtectedRoute.tsx       # Route guard for authenticated routes
│   └── UserDropdown.tsx         # User menu with logout
├── redux/
│   ├── authSlice.ts             # Redux slice with actions and reducers
│   └── authApi.ts               # API service for auth endpoints
└── types.ts                     # TypeScript interfaces
```

## Setup

### 1. Install Dependencies

```bash
npm install axios react-router-dom
```

### 2. Configure Environment

Create `.env` file:

```bash
VITE_API_URL=http://localhost:8000
```

### 3. Add Auth Reducer to Store

```typescript
// app/store.ts
import authReducer from '@/features/auth/redux/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // ... other reducers
  },
});
```

### 4. Setup Routes

```typescript
// App.tsx
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';

// Wrap protected routes with <ProtectedRoute>
```

## Usage

### Login

```typescript
import { useAppDispatch } from '@/app/hooks';
import { login } from '@/features/auth/redux/authSlice';

const dispatch = useAppDispatch();

await dispatch(
  login({
    email: 'user@example.com',
    password: 'password',
  })
);
```

### Register

```typescript
await dispatch(
  register({
    name: 'John Doe',
    email: 'user@example.com',
    password: 'password',
    password_confirmation: 'password',
  })
);
```

### Logout

```typescript
await dispatch(logout());
```

### Check Authentication Status

```typescript
const isAuthenticated = useAppSelector(selectIsAuthenticated);
const user = useAppSelector(selectUser);
```

### Protected Component

```typescript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

## Components

### UserDropdown

Add to your app header/navbar:

```typescript
import { UserDropdown } from '@/features/auth/components/UserDropdown';

<header>
  <UserDropdown />
</header>
```

## API Endpoints Required

Your Laravel backend should have these endpoints:

- `GET /sanctum/csrf-cookie` - Get CSRF token
- `POST /api/login` - Login user
- `POST /api/register` - Register user
- `POST /api/logout` - Logout user
- `GET /api/me` - Get authenticated user

## Security Notes

- Uses HttpOnly cookies to prevent XSS attacks
- CSRF protection via Laravel Sanctum
- Credentials included in all requests (`withCredentials: true`)
- Secure cookie flag enabled in production
- Passwords never stored in Redux state

## Testing with Postman

1. **Get CSRF Cookie**

   ```
   GET http://localhost:8000/sanctum/csrf-cookie
   ```

2. **Login**

   ```
   POST http://localhost:8000/api/login
   Body: { "email": "user@example.com", "password": "password" }
   ```

3. **Make Authenticated Request**
   ```
   GET http://localhost:8000/api/me
   (Cookies automatically sent by Postman)
   ```

## Troubleshooting

### Cookies not being sent?

Check CORS configuration in Laravel and ensure `withCredentials: true` in axios config.

### 401 Unauthorized on protected routes?

Make sure the user is logged in and cookies are being sent with requests.

### CSRF token mismatch?

Ensure you're calling `/sanctum/csrf-cookie` before login/register.
