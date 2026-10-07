const path = require('path');
const fs = require('fs');

// Ensure database path uses persistent storage environment variable if available
const DB_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_FILE = path.join(DB_DIR, 'database.json');

let data = { users: {}, transactions: [] };

if (fs.existsSync(DB_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to load DB, creating new standard structure');
  }
}

function saveData() {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  getUserById: (id) => data.users[id] || null,
  createUser: (id, initialBalance = 1000) => {
    data.users[id] = { id, balance: initialBalance, createdAt: new Date() };
    saveData();
    return data.users[id];
  },
  updateBalance: (id, amount) => {
    if (!data.users[id]) {
      data.users[id] = { id, balance: 1000, createdAt: new Date() };
    }
    data.users[id].balance += amount;
    saveData();
    return data.users[id].balance;
  }
};
