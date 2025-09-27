# Case Builder

## Project Structure

src/
│── assets/              # Images, fonts, etc.
│── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui components or wrappers
│
│── layouts/             # Page-level layouts
│   ├── LandingLayout.jsx
│   ├── AuthLayout.jsx   # Optional for login/signup
│   └── EditorLayout.jsx
│
│── pages/               # Route-based pages
│   ├── Landing/
│   │   └── LandingPage.jsx
│   ├── Auth/
│   │   ├── SignIn.jsx
│   │   └── SignUp.jsx
│   └── Editor/
│       └── EditorPage.jsx
│
│── hooks/               # Custom hooks
│── lib/                 # Helpers, utils, constants
│── context/             # React contexts (AuthProvider, ThemeProvider, etc.)
│── types/               # TypeScript types
│── routes/              # Route definitions
│   └── AppRoutes.jsx
│── App.jsx
│── main.jsx
│── index.css
