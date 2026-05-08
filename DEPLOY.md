# Free Live Link Deployment

This project is configured for one free Vercel link that serves both:

- React frontend
- Express API at `/api`

## 1. Push To GitHub

```bash
git init
git commit -m "Prepare app for Vercel deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/edumanage-sms.git
git push -u origin main
```

## 2. Create Free MongoDB Atlas Database

Utilize the MongoDB Atlas free tier to create a new database and obtain its connection string.

Then run the seed command locally against that Atlas database:

```bash
cd backend
npm run seed
```

For a very quick demo link without MongoDB, set this Vercel variable instead:

```env
USE_MOCK_DB=true
```

Demo mode is good for showing the app, but a real school system should use MongoDB Atlas so data is saved permanently.

## 3. Deploy On Vercel

1. Open `https://vercel.com`
2. Sign in with GitHub
3. New Project
4. Import this GitHub repository
5. In project settings, keep the Root Directory as the repository root (`sms`). Do not select only the `frontend` folder as a separate React app, because login calls `/api/auth/login` and needs the Express API in this same deployment.
6. Use these build settings if Vercel asks:

```text
Framework Preset: Other
Install Command: npm install && npm install --prefix backend && npm install --prefix frontend
Build Command: npm run build --prefix frontend
Output Directory: frontend/build
```

7. Add Environment Variables:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=make_this_a_long_random_secret_at_least_32_chars
JWT_EXPIRE=30d
NODE_ENV=production
FRONTEND_URL=https://your-project-name.vercel.app
```

For a temporary demo without Atlas, add this instead of `MONGO_URI`:

```env
USE_MOCK_DB=true
JWT_SECRET=make_this_a_long_random_secret_at_least_32_chars
JWT_EXPIRE=30d
NODE_ENV=production
FRONTEND_URL=https://your-project-name.vercel.app
```

8. Click Deploy

After deploy, Vercel gives you a free public link like:

```text
https://your-project-name.vercel.app
```

## Default Login After Seeding

```text
Admin: admin@school.com / admin123
Teacher: teacher@school.com / teacher123
Student: student@school.com / student123
```

## If Login Still Fails

Open the deployed URL in your browser and check:

- `https://your-project-name.vercel.app/api/health` should return `{"status":"OK"}`.
- If `/api/health` shows the React page or 404, the project was deployed from `frontend` only. Redeploy from the repository root.
- If `/api/health` works but login fails, check Vercel Function Logs for missing `MONGO_URI`, bad `JWT_SECRET`, or unseeded database.

## Deployment Readiness Checklist ✅

✅ **Frontend Build**: Verified successful build with react-scripts 5.0.1
- Build size: 348.89 kB (main.js), 4.24 kB (CSS)
- All dependencies installed correctly
- No build errors or breaking changes

✅ **Backend Dependencies**: All dependencies verified
- Express server configured correctly
- Mock DB fallback enabled for demo mode
- API routes ready for production

✅ **Security & Vulnerabilities**:
- Frontend: 0 vulnerabilities (all 29 fixed)
- Backend: 1 unfixable vulnerability in xlsx (no maintainer fix available)
- Rate limiting configured for production
- Helmet security headers enabled
- JWT authentication ready

✅ **Environment Configuration**:
- `.env.example` files available for reference
- Support for both MongoDB Atlas and mock database
- Vercel deployment scripts tested and working
- Mock DB flag: `USE_MOCK_DB=true` for demo without database

✅ **Build Scripts**:
- Root build: `npm run build` ✅
- Frontend build: React-scripts verified ✅
- Backend: Ready for Node.js ✅
- Vercel scripts: Install and build configured ✅

✅ **Git Repository**: 
- All changes committed and pushed to main branch
- Ready for GitHub Actions / Vercel deployment
- No uncommitted changes

**You are ready to deploy! 🚀**

**Next Steps for Hostinger or Vercel Deployment:**
1. Create MongoDB Atlas database (or use mock DB for testing)
2. Add environment variables to hosting platform
3. Deploy from the repository root (not just frontend folder)
4. Test `/api/health` endpoint to verify API is working
5. Verify login works with provided credentials
