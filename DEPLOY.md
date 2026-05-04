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

Use MongoDB Atlas free tier and copy your connection string.

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
5. Add Environment Variables:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=make_this_a_long_random_secret_at_least_32_chars
JWT_EXPIRE=30d
NODE_ENV=production
```

6. Click Deploy

After deploy, Vercel gives you a free public link like:

```text
https://your-project-name.vercel.app
```

## Default Login After Seeding

```text
Admin: admin@school.com / admin123
Teacher: teacher1@school.com / teacher123
Student: student1@school.com / student123
```
