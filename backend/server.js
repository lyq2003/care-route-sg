require('dotenv').config();
const http = require('http');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoute = require('./src/routes/users');
const elderlyRoute = require('./src/routes/elderly');
const mainRoutes= require('./src/routes/routes');
require('./src/config/passport');
const app = express();
const server=http.createServer(app);

const PORT = process.env.PORT || 5173;

//middleware
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration (espress-session)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, //(This cause cookies to be sent over HTTPS)process.env.NODE_ENV === 'production',
    maxAge: 86400000, // 24 hours
    httpOnly: true,
    samesite: 'none',
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Register all routes
app.use('/api', mainRoutes);
app.use('/api/users', userRoute);
app.use('/api/elderly', elderlyRoute);
app.use('/api/admin', require('./src/routes/admin'));
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// root route FOR NOW(Change after frontend created)
app.get('/', (req, res) => {
  res.send('API Server is running. No frontend is connected.');
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server + WebSockets running on http://localhost:${PORT}`);
});