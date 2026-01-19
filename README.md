# 🏔️ Mount Kenya News

<div align="center">

![Mount Kenya News](public/mtker.png)

**Your Trusted Source for News from the Mt. Kenya Region and Beyond**

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://mtkenyanews.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## ✨ Features

### 📰 News Platform
- **Breaking News Ticker** - Real-time breaking news updates
- **Category Sections** - Politics, Business, Sports, Entertainment, Counties & more
- **Article Management** - Rich text editor with image support
- **Search Functionality** - Full-text search across all articles
- **Responsive Design** - Optimized for mobile, tablet, and desktop

### 🎨 User Experience
- **Dark/Light Mode** - Toggle between themes
- **Color Themes** - 6 customizable color schemes
- **Font Size Options** - Accessibility-focused text sizing
- **Smooth Animations** - Modern scroll animations and transitions

### 👨‍💼 Admin Dashboard
- **Article CRUD** - Create, read, update, delete articles
- **Rich Text Editor** - Quill editor with image resizing
- **Category Management** - Organize content by categories
- **Author Profiles** - Manage writers and contributors
- **Comment Moderation** - Approve/reject user comments
- **Subscriber Management** - View and manage newsletter subscribers
- **Analytics Dashboard** - View counts and engagement stats

### 📧 Communication
- **Newsletter Subscription** - Email capture with auto-reply
- **Contact Form** - SMTP-powered contact form
- **Social Integration** - Facebook, Twitter, Instagram, YouTube links

---

## 🚀 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Lucide Icons | Icons |
| React Quill | Rich Text Editor |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | API Framework |
| PostgreSQL | Database (Neon) |
| Nodemailer | Email Service |
| JWT | Authentication |
| Multer | File Uploads |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) account)
- Namecheap email (optional, for contact form)

### Clone the Repository
```bash
git clone https://github.com/SHADRACK152/mountkenyanewstv.git
cd mountkenyanewstv
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your database and SMTP credentials

# Initialize database
npm run init-db

# Start development server
npm run dev
```

---

## ⚙️ Environment Variables

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:4000
```

### Backend (`server/.env`)
```env
# Database
NEON_DATABASE_URL=your_postgres_connection_string

# Admin Credentials
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
ADMIN_JWT_SECRET=your_jwt_secret

# Email (Namecheap Private Email)
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=info@yourdomain.com
SMTP_PASS=your_email_password
SMTP_FROM=info@yourdomain.com
```

---

## 🌐 Deployment (Vercel - All-in-One)

This project is configured for **unified deployment** on Vercel - both frontend and backend API run from the same domain.

### Deploy to Vercel

1. **Import Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import from GitHub: `SHADRACK152/mountkenyanewstv`

2. **Configure Project**
   - Framework Preset: **Vite**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)

3. **Add Environment Variables**
   ```
   # Database (Neon PostgreSQL)
   NEON_DATABASE_URL=postgresql://neondb_owner:npg_ZBhsyAzMF84m@ep-odd-waterfall-a49u2nmr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   
   # Admin Authentication
   ADMIN_USER=admin
   ADMIN_PASS=Mtkenya@2025
   ADMIN_JWT_SECRET=Z7w3kq9bY4sXrP2n
   
   # Email (Namecheap Private Email)
   SMTP_HOST=mail.privateemail.com
   SMTP_PORT=587
   SMTP_USER=info@mtkenyanews.com
   SMTP_PASS=Mtkenya@123
   SMTP_FROM=info@mtkenyanews.com
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Deploy!**
   - Click "Deploy"
   - Your site will be live at `https://your-project.vercel.app`

### Custom Domain
1. Go to Project → Settings → Domains
2. Add `mtkenyanews.com`
3. Update DNS records at Namecheap

---

## 📱 Screenshots

<div align="center">

| Homepage | Article Page |
|----------|--------------|
| ![Home](https://via.placeholder.com/400x300?text=Homepage) | ![Article](https://via.placeholder.com/400x300?text=Article) |

| Admin Dashboard | Dark Mode |
|-----------------|-----------|
| ![Admin](https://via.placeholder.com/400x300?text=Admin) | ![Dark](https://via.placeholder.com/400x300?text=Dark+Mode) |

</div>

---

## 📂 Project Structure

```
mountkenyanewstv/
├── api/
│   └── index.ts           # Vercel serverless API (all endpoints)
├── public/                 # Static assets
│   └── mtker.png          # Logo
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Theme)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # API & utilities
│   └── pages/             # Page components
│       └── admin/         # Admin dashboard pages
├── server/                # Legacy Express server (local dev)
├── vercel.json            # Vercel configuration
└── README.md
```

---

## 🔐 Admin Access

Default admin credentials (change in production):
- **URL**: `/admin-login` or `/#admin-login`
- **Username**: `admin`
- **Password**: Set in `ADMIN_PASS` environment variable

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Mount Kenya News**
- 🌐 Website: [mtkenyanews.com](https://mtkenyanews.com)
- 📧 Email: info@mtkenyanews.com
- 📍 Location: Nyeri, Kenya

---

<div align="center">

**Made with ❤️ in Kenya**

© 2026 Mount Kenya News. All rights reserved.

</div>
