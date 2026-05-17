# U App

Ung dung quan ly suc khoe toan dien cho thi truong Viet Nam.

## Quick Start

```bash
# Backend
cd backend && npm install && npm run dev

# Admin
cd admin && npm install && npm run dev

# Mobile (requires Expo environment)
cd mobile && npx expo start
```

## Environment Setup

Copy `.env.example` to `.env` in each workspace and fill in your values:
- `backend/.env.example` -- MongoDB Atlas, JWT secrets, Cloudinary, Firebase, AI keys
- `mobile/.env.example` -- Backend API URL
- `admin/.env.example` -- Backend API URL

## Running Dev Servers

| Service | Command | Port |
|---------|---------|------|
| Backend | `cd backend && npm run dev` | 3000 |
| Admin | `cd admin && npm run dev` | 3001 |
| Mobile | `cd mobile && npx expo start` | 8081 |

## Deploying

- **Backend**: Render -- auto-deploy from `main` branch via `backend/render.yaml`
- **Admin**: Vercel -- connect GitHub repo, set root to `admin/`
- **Mobile**: EAS -- `eas build --profile production --platform all` (see `mobile/EAS-README.md`)
