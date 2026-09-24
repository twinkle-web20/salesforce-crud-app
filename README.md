# Salesforce CRUD Web Application

A modern full-stack web application that performs CRUD (Create, Read, Update, Delete) operations on Salesforce standard objects using OAuth 2.0 authentication.

## 🚀 Live Demo

- **Frontend:** https://salesforce-crud-frontend-qdut.onrender.com
- **Backend:** https://salesforce-crud-backend-gmhz.onrender.com
- **GitHub:** https://github.com/twinkle-web20/salesforce-crud-app

## ✨ Features

- ✅ **OAuth 2.0 Authentication** via Salesforce External Client App
- ✅ **5 Standard Objects:** Account, Opportunity, Lead, Contact, Case
- ✅ **Full CRUD Operations:** Create, Read, Update, Delete
- ✅ **Dynamic Field Display** (8 fields per object)
- ✅ **Pagination** (20 records per page)
- ✅ **Search Functionality** (filter records in real-time)
- ✅ **Responsive Design** (mobile, tablet, desktop)
- ✅ **Modern UI** (White + Red theme with TailwindCSS)
- ✅ **Toast Notifications** for user feedback
- ✅ **Session Management** with secure cookies

## 📸 Screenshots

### Login Page
![Login](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Records Table
![Records](screenshots/records.png)

### Create/Edit Modal
![Modal](screenshots/modal.png)

### Settings Page
![Settings](screenshots/settings.png)

### Profile Page
![Profile](screenshots/profile.png)

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite)
- **TailwindCSS 3** for styling
- **Axios** for API calls
- **React Hooks** (useState, useEffect, useRef, useCallback)

### Backend
- **Node.js** with **Express.js**
- **express-session** for session management
- **axios** for Salesforce API calls
- **dotenv** for environment variables
- **crypto** for PKCE implementation

### Authentication
- **Salesforce OAuth 2.0** (Authorization Code Flow with PKCE)
- **External Client App** for secure authentication

### API
- **Salesforce REST API v60.0**
- **SOQL** for queries

### Deployment
- **Render** (Backend Web Service + Frontend Static Site)
- **GitHub** for version control

## 📁 Project Structure

\`\`\`
salesforce-crud-app/
├── backend/
│   ├── routes/
│   │   ├── oauth.js          # OAuth login/callback/logout
│   │   └── salesforce.js     # CRUD operations
│   ├── .env.example          # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js             # Main Express server
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ObjectDropdown.jsx    # Object selector
    │   │   ├── ProfileHeader.jsx     # User profile dropdown
    │   │   ├── RecordModal.jsx       # Create/Edit form
    │   │   ├── RecordTable.jsx       # Records table
    │   │   └── Sidebar.jsx           # Navigation sidebar
    │   ├── api.js            # Axios configuration
    │   ├── App.jsx           # Main component
    │   ├── index.css         # Tailwind + custom styles
    │   └── main.jsx          # Entry point
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
\`\`\`

## 🔧 Setup Instructions

### Prerequisites

- Node.js (v18+)
- Salesforce Developer Org
- External Client App with OAuth 2.0

### Step 1: Clone the Repository

\`\`\`bash
git clone https://github.com/twinkle-web20/salesforce-crud-app.git
cd salesforce-crud-app
\`\`\`

### Step 2: Salesforce Setup

1. Create a Developer Org at [developer.salesforce.com/signup](https://developer.salesforce.com/signup)
2. Create an **External Client App** in Setup → App Manager
3. Configure:
   - **Callback URL:** `http://localhost:5000/oauth/callback`
   - **OAuth Scopes:** `api`, `refresh_token`, `offline_access`
   - Enable **Authorization Code and Credentials Flow**
   - Enable **Require Secret for Web Server Flow**
   - Enable **Require Secret for Refresh Token Flow**
4. Copy the **Consumer Key** and **Consumer Secret**

### Step 3: Backend Setup

\`\`\`bash
cd backend
npm install
\`\`\`

Create `.env` file:
\`\`\`env
SF_CLIENT_ID=your_consumer_key
SF_CLIENT_SECRET=your_consumer_secret
SF_REDIRECT_URI=http://localhost:5000/oauth/callback
SF_LOGIN_URL=https://login.salesforce.com
SESSION_SECRET=your_random_secret
PORT=5000
FRONTEND_URL=http://localhost:5173
\`\`\`

Run backend:
\`\`\`bash
npm run dev
\`\`\`

### Step 4: Frontend Setup

\`\`\`bash
cd frontend
npm install
\`\`\`

Create `.env` file:
\`\`\`env
VITE_API_URL=http://localhost:5000
\`\`\`

Run frontend:
\`\`\`bash
npm run dev
\`\`\`

### Step 5: Access the Application

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔐 OAuth 2.0 Flow

1. User clicks **"Login with Salesforce"**
2. Redirected to Salesforce login page
3. User enters credentials and authorizes the app
4. Salesforce redirects back with authorization code
5. Backend exchanges code for access token (with PKCE)
6. Token stored in session cookie
7. All API calls use the token to access Salesforce

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oauth/login` | Initiate OAuth flow |
| GET | `/oauth/callback` | Handle OAuth callback |
| GET | `/oauth/status` | Check login status + user info |
| GET | `/oauth/logout` | Logout and destroy session |
| GET | `/api/:object` | Fetch records (paginated) |
| POST | `/api/:object` | Create new record |
| PATCH | `/api/:object/:id` | Update existing record |
| DELETE | `/api/:object/:id` | Delete record |

**Supported Objects:** `Account`, `Opportunity`, `Lead`, `Contact`, `Case`

## 🌟 Highlights

- **PKCE Support:** Secure OAuth flow with code challenge
- **Session Management:** Express sessions with secure cookies
- **Pagination + Infinite Scroll:** Both implemented
- **Error Handling:** User-friendly error messages from Salesforce
- **Salesforce Validation:** Shows Salesforce errors to user
- **Responsive:** Works on mobile, tablet, desktop
- **Modern UI:** Clean design with TailwindCSS

## 🔒 Security

- OAuth 2.0 with PKCE for secure authentication
- Client secret stored in backend only (never exposed to frontend)
- Session cookies with `httpOnly`, `secure`, `sameSite` flags
- `.env` files excluded from version control
- CORS configured for specific frontend origin

## 📝 License

This project was created as part of a hiring assignment for CloudVandana.

## 👤 Author

**Kritika Singh**
- 📧 Email: kritikasinghsam@gmail.com
- 🐙 GitHub: [@twinkle-web20](https://github.com/twinkle-web20)

---

**Built with ❤️ using React, Node.js, and Salesforce**
