# CareRoute Singapore

**CareRoute** is a comprehensive platform designed to help elderly users in Singapore navigate the city with confidence. The application provides real-time accessible routes, connects elderly users with caring volunteers, and keeps caregivers informed about their loved ones' journeys.

## 🌟 Features

- **Smart Route Planning**: Accessible route recommendations for elderly users
- **Volunteer Network**: Connect elderly users with nearby volunteers for assistance
- **Caregiver Dashboard**: Real-time tracking and monitoring of linked elderly users
- **Multi-language Support**: English, Chinese, Malay, and Tamil
- **Real-time Notifications**: WebSocket-based notifications for all user types
- **Admin Panel**: Comprehensive user management and moderation tools
- **Review & Reporting System**: Built-in feedback and safety mechanisms

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** (PostgreSQL database & Authentication)
- **Socket.IO** (Real-time communication)
- **Passport.js** (Authentication)
- **Multer** (File uploads)

### Frontend
- **React 18** with TypeScript
- **Vite** (Build tool)
- **React Router DOM** (Routing)
- **Zustand** (State management)
- **Axios** (HTTP client)
- **Socket.IO Client** (Real-time)
- **Google Maps JS API** (Mapping)
- **shadcn/ui** (UI components)
- **Tailwind CSS** (Styling)
- **i18next** (Internationalization)

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/en)
- **npm** (comes with Node.js)
- **Supabase Account** (for database and authentication)
- **Google Cloud Platform Account** (for Maps API and OAuth)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd care-route-sg
```

### 2. Backend Setup

```bash
cd backend
npm install
```

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

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5174`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_BACKEND_URL=http://localhost:5174
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173` to start using CareRoute!

## 📚 Documentation

### API Documentation

Comprehensive backend API documentation is available. To generate and view:

```bash
cd backend
npm run docs:generate  # Generate documentation
npm run docs:serve     # View at http://localhost:8080
npm run docs:clean     # Clean generated docs
```

**Documentation includes:**
- All domain models (User, Elderly, Caregiver, Volunteer, Admin)
- All controller endpoints with route information
- All service methods with parameters and return types
- Examples and usage guides

### Frontend Documentation

TypeDoc documentation for React components and TypeScript utilities:

```bash
cd frontend
npm run docs:generate  # Generate documentation
npm run docs:serve     # View at http://localhost:8081
npm run docs:clean     # Clean generated docs
```

**Documentation includes:**
- React components with props and usage
- TypeScript utilities and helpers
- State management stores (Zustand)
- Custom hooks
- Page components


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
│   │   └── services/      # Business logic
│   ├── docs/              # Generated API documentation
│   └── package.json
│
├── frontend/               # React/TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── features/      # Feature-specific code
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   └── lib/          # Utilities
│   ├── docs/             # Generated frontend documentation
│   └── package.json
│
└── README.md             # This file
```

## 👥 User Roles

The platform supports four user types:

1. **Elderly Users**: Request help and navigate with accessible routes
2. **Caregivers**: Monitor linked elderly users and manage their profiles
3. **Volunteers**: Accept and fulfill help requests from elderly users
4. **Admins**: Manage users, moderate reports/reviews, and oversee the platform

## 🔐 Authentication

- **Email/Password**: Traditional authentication
- **Google OAuth 2.0**: Single sign-on option
- **Session-based**: Secure HTTP-only cookies
- **Role-based Access Control**: Protected routes by user role

## 🌐 API Endpoints

### Main Endpoints

- `/api/auth/*` - Authentication (login, logout, OAuth)
- `/api/users/*` - User management
- `/api/elderly/*` - Elderly user operations
- `/api/caregiver/*` - Caregiver operations
- `/api/volunteer/*` - Volunteer operations
- `/api/admin/*` - Admin operations
- `/api/reports/*` - Report submission and moderation
- `/api/reviews/*` - Review submission and viewing

See the generated API documentation for complete endpoint details.

## 🛠️ Development Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run docs:generate` - Generate API documentation
- `npm run docs:serve` - Serve documentation locally

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run docs:generate` - Generate TypeDoc documentation

## 🧪 Testing

(Add testing information when tests are implemented)

## 🚢 Deployment

### Backend Deployment
- Ensure all environment variables are set
- Set `NODE_ENV=production`
- Start with `npm start` or use PM2/systemd

### Frontend Deployment
- Build: `npm run build`
- Deploy the `dist/` folder to your hosting service
- Configure environment variables in your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

(Add license information)

## 👤 Authors

- Your Team Name

## 🙏 Acknowledgments

- Singapore Government for accessibility data
- Google Maps Platform for routing services
- Supabase for backend infrastructure
- shadcn/ui for beautiful component library

---

For more information, see the [documentation](#-documentation) section above.
