# CareRoute Singapore

A comprehensive platform designed to help elderly users in Singapore navigate the city with confidence. CareRoute provides real-time accessible routes, connects elderly users with caring volunteers, and keeps caregivers informed about their loved ones' journeys.

## 🌟 Features

- **Smart Route Planning**: Accessible route recommendations tailored for elderly users
- **Volunteer Network**: Connect with nearby volunteers for assistance
- **Caregiver Dashboard**: Real-time tracking and monitoring of linked elderly users
- **Help Request System**: Elderly users can request assistance from volunteers
- **Multi-language Support**: English, Chinese, Malay, and Tamil
- **Real-time Notifications**: WebSocket-based notifications for all user types
- **Admin Panel**: Comprehensive user management and moderation tools
- **Review & Reporting System**: Built-in feedback and safety mechanisms

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** (PostgreSQL database & Authentication)
- **Socket.IO** (Real-time communication)
- **Passport.js** (Authentication with Google OAuth)
- **Multer** (File uploads)

### Frontend
- **React 18** with TypeScript
- **Vite** (Build tool)
- **React Router DOM** (Routing)
- **Zustand** (State management)
- **Axios** (HTTP client)
- **Socket.IO Client** (Real-time)
- **Google Maps JS API** (Mapping & routing)
- **shadcn/ui** (UI component library)
- **Tailwind CSS** (Styling)
- **i18next** (Internationalization)

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/en)
- **npm** (comes with Node.js)
- **Supabase Account** (for database and authentication)
- **Google Cloud Platform Account** (for Maps API and OAuth)

## 🚀 Getting Started

### Requirements
Install Node.js -> https://nodejs.org/en

### Running the Application

Once Node.js is installed, you need to start both the frontend and backend servers:

**1. To start the backend server**, create a new terminal and type:
```bash
cd backend
npm i
npm run dev
```

**2. To start the frontend server**, create another new terminal and type:
```bash
cd frontend
npm i
npm run dev
```

**3. Access the application:**
- In the frontend terminal, you should see that the server is hosted on a URL like `http://localhost:5173/`
- **Ctrl + click** on the link or copy and paste it into a browser to start using the website

### Environment Variables Setup

#### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
VITE_BACKEND_URL=http://localhost:5174
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_BACKEND_URL=http://localhost:5174
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 📁 Project Structure

```
care-route-sg/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # Configuration files (Supabase, Passport)
│   │   ├── controllers/    # Request handlers
│   │   ├── domain/         # Domain models and enums
│   │   ├── middleware/     # Auth and socket middleware
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   ├── docs/              # Generated API documentation
│   └── server.js          # Entry point
│
├── frontend/               # React/TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   └── ...        # Feature components
│   │   ├── features/      # Feature-specific code
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── lib/           # Utilities
│   │   └── locales/       # Translation files
│   └── package.json
│
└── README.md              # This file
```

## 👥 User Roles

The platform supports four distinct user types:

1. **Elderly Users** (`/elderly_dashboard`)
   - Request help from volunteers
   - View accessible routes
   - Link with caregivers using PIN
   - Track location and trips
   - Submit reviews for completed requests

2. **Caregivers** (`/caregiver_dashboard`)
   - Link to elderly users via PIN
   - Monitor linked elderly users in real-time
   - View help request history
   - Submit reports on behalf of elderly users
   - Manage elderly user profiles

3. **Volunteers** (`/volunteer_dashboard`)
   - View nearby help requests
   - Accept/cancel help requests
   - Track route and provide progress updates
   - Complete help requests
   - Receive reviews and ratings

4. **Admins** (`/admin_dashboard`)
   - Manage all users (suspend, deactivate, reactivate)
   - Moderate reports and reviews
   - View dashboard statistics
   - Access admin activity logs
   - Reassign volunteers to requests

## 🌐 Application Routes

### Public Routes
- `/` - Landing page (Index)
- `/login` - Sign in page
- `/signup` - Sign up page
- `/WelcomeScreen` - Welcome screen
- `/roles` - Role selection
- `/auth/success` - OAuth callback handler

### Protected Routes (Requires Authentication)
- `/elderly_dashboard` - Elderly user dashboard
- `/caregiver_dashboard` - Caregiver dashboard
- `/volunteer_dashboard` - Volunteer dashboard
- `/admin_dashboard` - Admin dashboard
- `/request_help` - Create help request
- `/request_filter` - Filter help requests (volunteers)
- `/chasLocation` - CHAS clinic locations

## 🔐 Authentication

The application supports two authentication methods:

- **Email/Password**: Traditional form-based authentication
- **Google OAuth 2.0**: Single sign-on option

Both methods use session-based authentication with secure HTTP-only cookies.

## 🛠️ Development Scripts

### Backend
```bash
npm run dev      # Start development server with nodemon (auto-reload)
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start Vite development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔌 API Endpoints

### Main API Routes

- `/api/auth/*` - Authentication (login, logout, OAuth)
- `/api/users/*` - User management
- `/api/elderly/*` - Elderly user operations
- `/api/caregiver/*` - Caregiver operations
- `/api/volunteer/*` - Volunteer operations
- `/api/admin/*` - Admin operations
- `/api/reports/*` - Report submission and moderation
- `/api/reviews/*` - Review submission and viewing

**Note**: All API endpoints are prefixed with `/api`. The backend runs on port 5174 by default.

## 📱 Key Features by Role

### Elderly Users
- Create help requests with location and description
- Link caregivers using 6-digit PIN
- View accessible routes using Google Maps
- Track location and share with caregivers
- Review volunteers after completed requests

### Caregivers
- Link to elderly users via PIN
- Real-time location tracking of linked elderly
- View help request history
- Manage elderly user profiles
- Receive notifications for elderly activities

### Volunteers
- Browse nearby help requests (within 10km radius)
- Filter requests by urgency and distance
- Accept and manage help requests
- Send progress updates to caregivers
- Complete requests and earn ratings

### Admins
- Dashboard with user statistics
- User management (suspend, deactivate, reactivate)
- Report moderation workflow
- Review moderation
- System-wide notifications

## 🌍 Internationalization

The application supports four languages:
- English (en) - Default
- Chinese (zh)
- Malay (ms)
- Tamil (ta)

Language preference is stored in localStorage and persists across sessions.

## 🐛 Troubleshooting

### Backend won't start
- Ensure Node.js v18+ is installed
- Check that all environment variables are set in `backend/.env`
- Verify Supabase credentials are correct
- Check if port 5174 is available

### Frontend won't start
- Ensure Node.js v18+ is installed
- Check that `VITE_BACKEND_URL` is set correctly
- Verify Google Maps API key is valid
- Check if port 5173 is available

### Authentication issues
- Clear browser cookies
- Verify Supabase authentication settings
- Check Google OAuth credentials in backend `.env`

### Socket connection issues
- Ensure backend server is running
- Check WebSocket support in browser
- Verify `VITE_BACKEND_URL` matches backend URL

## 📝 Development Notes

- The backend uses Express.js with session-based authentication
- Real-time features use Socket.IO for WebSocket communication
- Frontend uses React Query for server state management
- State management is handled by Zustand stores
- UI components are from shadcn/ui library
- Styling uses Tailwind CSS utility classes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors

Ching Shin Lu
Wang Hao Stefano 
Chong Kai Ying
Khant Naing Lin
Mallvin Rajamohan 
Liu Yunqing

---

For questions or issues, please open an issue in the repository.
