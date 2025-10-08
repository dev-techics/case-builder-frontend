
src/
└── features/
    └── feature-name/
        ├── components/     # All feature of this components
        │   ├── Menu.tsx
        │   ├── Item.tsx
        │   └── UserInfo.tsx
        ├── hooks/          # Hooks
        │   └── useData.ts
        ├── services/       # Api Calls
        │   └── Api.ts
        ├── feature.tsx     # All components will render here
        └── index.ts        # This file will return the feature.tsx file by just calling features/feature-name
                                the full path isn't need.