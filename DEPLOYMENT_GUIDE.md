# RemedyEase Deployment Guide with Proxy Configuration

## Overview
This application now uses proxy configuration for easier deployment. All hardcoded URLs have been removed and replaced with relative paths that work through proxy servers.

## Architecture
- **Frontend**: React/Vite app on port 5173 (development)
- **User Backend**: Node.js/Express on port 8000 
- **Doctor Backend**: Node.js/Express on port 5001

## Proxy Configuration

### Development (Local)
The Vite development server automatically proxies API requests:
- `/user-api/*` → `http://localhost:8000/*`
- `/doctor-api/*` → `http://localhost:5001/*`

### Production Deployment Options

#### Option 1: Single Server with Nginx Reverse Proxy
```nginx
# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    # Serve frontend
    location / {
        root /path/to/built/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Proxy user backend APIs
    location /user-api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy doctor backend APIs  
    location /doctor-api/ {
        proxy_pass http://localhost:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Option 2: Separate Deployments with API Gateway
- Frontend: Deploy to Vercel/Netlify
- Backends: Deploy to Railway/Render/AWS
- Use API Gateway or reverse proxy to route requests

#### Option 3: Containerized with Docker
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./RemedyEase
    ports:
      - "80:80"
    depends_on:
      - user-backend
      - doctor-backend

  user-backend:
    build: ./Backend
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - DOCTOR_BACKEND_URL=http://doctor-backend:5001

  doctor-backend:
    build: ./Bckend_for_Doctor
    ports:
      - "5001:5001"
    environment:
      - PORT=5001
```

## Environment Variables

### Frontend (.env)
```env
# For development
VITE_USER_BACKEND_URL=http://localhost:8000
VITE_DOCTOR_BACKEND_URL=http://localhost:5001

# For production (leave empty to use proxy)
# VITE_USER_BACKEND_URL=
# VITE_DOCTOR_BACKEND_URL=
```

### User Backend (.env)
```env
DATABASE_URI=mongodb://...
PORT=8000
DOCTOR_BACKEND_URL=http://localhost:5001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_secret
```

### Doctor Backend (.env)
```env
DATABASE_URI=mongodb://...
PORT=5001
USER_BACKEND_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_secret
GROQ_API_KEY=your_groq_key
```

## Key Benefits of Proxy Setup

✅ **No hardcoded URLs** - Easier to deploy anywhere
✅ **Environment agnostic** - Works in dev, staging, production
✅ **CORS simplified** - No complex CORS configuration needed
✅ **Single domain** - All APIs accessible through same domain
✅ **SSL termination** - Handle HTTPS at proxy level
✅ **Load balancing** - Can distribute traffic across multiple backend instances

## Development Commands

```bash
# Start all services for development
npm run dev  # in RemedyEase folder (starts frontend with proxy)
npm run dev  # in Backend folder (starts user backend)
npm run dev  # in Bckend_for_Doctor folder (starts doctor backend)
```

## Production Build

```bash
# Build frontend for production
cd RemedyEase
npm run build

# The built files will be in dist/ folder
# Deploy this to your web server with proper proxy configuration
```

## Next Steps for Deployment

1. Choose your deployment platform
2. Set up environment variables
3. Configure reverse proxy/API gateway
4. Deploy backends first, then frontend
5. Test all API endpoints through proxy paths

This setup makes your application much more deployment-friendly and production-ready! 🚀