const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const db = require('./src/db');
const { registerGame, getGameList } = require('./src/gameRegistry');

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || '6123';
const STARTING_CREDITS = parseFloat(process.env.STARTING_CREDITS || '1000');
const GAME_ASSET_ROOT = process.env.GAME_ASSET_ROOT || path.join(__dirname, 'game-assets');

if (!fs.existsSync(GAME_ASSET_ROOT)) {
  fs.mkdirSync(GAME_ASSET_ROOT, { recursive: true });
}

const adminSessions = new Map();

// Session cleanup on restart or dynamic management
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Relaxed CSP to allow External CDNs, WebSockets, Images, and Media
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "*"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"],
        styleSrc: ["'self'", "'unsafe-inline'", "*"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
        mediaSrc: ["'self'", "data:", "blob:", "*"],
        connectSrc: ["'self'", "*", "ws:", "wss:"],
        frameAncestors: ["'self'", "*"]
      }
    },
    frameguard: false
  })
);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/games', express.static(GAME_ASSET_ROOT));

// Auth Middleware
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.cookies.admin_token;
  if (token && adminSessions.has(token)) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized Admin' });
}

function userAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.cookies.user_id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'User ID required' });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  req.user = user;
  next();
}

// Global Crash Game Engine State (Shared for ALL Players)
const globalCrashState = {
  roundId: Date.now(),
  state: 'WAIT', // WAIT, FLY, CRASHED
  multiplier: 1.0,
  history: [],
  forceCrashNext: false,
  forcedTarget: null,
  startTime: Date.now()
};

// Global Crash Engine Loop
setInterval(() => {
  if (globalCrashState.state === 'WAIT') {
    if (Date.now() - globalCrashState.startTime > 5000) { // 5s wait time
      globalCrashState.state = 'FLY';
      globalCrashState.startTime = Date.now();
      globalCrashState.multiplier = 1.0;
    }
  } else if (globalCrashState.state === 'FLY') {
    const elapsed = (Date.now() - globalCrashState.startTime) / 1000;
    globalCrashState.multiplier = +(1.0 + Math.pow(elapsed, 1.8) * 0.05).toFixed(2);

    // Dynamic Force Crash check or random crash
    const crashThreshold = globalCrashState.forcedTarget || 10.0;
    if (globalCrashState.forceCrashNext || globalCrashState.multiplier >= crashThreshold || Math.random() < 0.02) {
      globalCrashState.state = 'CRASHED';
      globalCrashState.history.unshift(globalCrashState.multiplier);
      if (globalCrashState.history.length > 20) globalCrashState.history.pop();
      globalCrashState.forceCrashNext = false;
      globalCrashState.forcedTarget = null;
      globalCrashState.startTime = Date.now();
    }
  } else if (globalCrashState.state === 'CRASHED') {
    if (Date.now() - globalCrashState.startTime > 3000) { // 3s result wait
      globalCrashState.state = 'WAIT';
      globalCrashState.roundId = Date.now();
      globalCrashState.multiplier = 1.0;
      globalCrashState.startTime = Date.now();
    }
  }
}, 100);

// Admin Routes
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    const token = 'admin_' + Math.random().toString(36).substring(2);
    adminSessions.set(token, true);
    res.cookie('admin_token', token, { httpOnly: true });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: 'Invalid PIN' });
});

// Admin Live Force Crash (Independent of User Auth & State)
app.post('/api/admin/force-crash', adminAuth, (req, res) => {
  const { targetMultiplier } = req.body;
  globalCrashState.forceCrashNext = true;
  if (targetMultiplier) {
    globalCrashState.forcedTarget = parseFloat(targetMultiplier);
  }
  return res.json({ success: true, message: 'Force crash scheduled successfully' });
});

// Crash API (Global State Return)
app.get('/api/crash/state', (req, res) => {
  res.json({ success: true, state: globalCrashState });
});

// Global Wallet API for Games
app.post('/api/wallet/debit', userAuth, (req, res) => {
  const { amount } = req.body;
  if (req.user.balance >= amount) {
    const newBal = db.updateBalance(req.user.id, -amount);
    return res.json({ success: true, balance: newBal });
  }
  return res.status(400).json({ success: false, error: 'Insufficient balance' });
});

app.post('/api/wallet/credit', userAuth, (req, res) => {
  const { amount } = req.body;
  const newBal = db.updateBalance(req.user.id, amount);
  return res.json({ success: true, balance: newBal });
});

app.get('/api/wallet/balance', userAuth, (req, res) => {
  return res.json({ success: true, balance: req.user.balance });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
