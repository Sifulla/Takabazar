let adminToken = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchBalance();
  fetchGameList();
  startCrashSync();
});

// Balance Fetch
async function fetchBalance() {
  try {
    const res = await fetch('/api/wallet/balance');
    const data = await res.json();
    if (data.success) {
      document.getElementById('walletBalance').innerText = parseFloat(data.balance).toFixed(2);
    }
  } catch(e){}
}

// Fetch Dynamic ZIP Games
async function fetchGameList() {
  try {
    const res = await fetch('/api/games/list');
    const games = await res.json();
    const grid = document.getElementById('gameGrid');
    
    if (games && games.length > 0) {
      games.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
          <div class="card-thumb">🎰</div>
          <div class="card-info">
            <h4>${game.id}</h4>
            <p>Engine: ${game.engine}</p>
            <button class="play-btn" onclick="launchExternalGame('${game.url}', '${game.id}')">Play Game</button>
          </div>
        `;
        grid.appendChild(card);
      });
    }
  } catch(e){}
}

// Switch UI Views
function showLobby() {
  document.getElementById('lobbyView').classList.remove('hidden');
  document.getElementById('gameScreenView').classList.add('hidden');
  document.getElementById('iframeContainer').innerHTML = '';
}

function startCrashGame() {
  document.getElementById('lobbyView').classList.add('hidden');
  document.getElementById('gameScreenView').classList.remove('hidden');
  document.getElementById('activeGameTitle').innerText = 'Live SkyRush Crash';
  document.getElementById('builtInCrashScreen').classList.remove('hidden');
  document.getElementById('iframeContainer').classList.add('hidden');
}

function launchExternalGame(url, title) {
  document.getElementById('lobbyView').classList.add('hidden');
  document.getElementById('gameScreenView').classList.remove('hidden');
  document.getElementById('activeGameTitle').innerText = title;
  document.getElementById('builtInCrashScreen').classList.add('hidden');
  
  const container = document.getElementById('iframeContainer');
  container.classList.remove('hidden');
  container.innerHTML = `<iframe src="${url}" style="width:100%; height:80vh; border:none;" allow="autoplay; fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>`;
}

// Global Crash Engine Sync
function startCrashSync() {
  setInterval(async () => {
    try {
      const res = await fetch('/api/crash/state');
      const data = await res.json();
      if (data.success) {
        document.getElementById('liveMultiplier').innerText = data.state.multiplier + 'x';
        document.getElementById('liveStatus').innerText = 'STATE: ' + data.state.state;
      }
    } catch(e){}
  }, 200);
}

// Admin Modal Actions
function openAdminModal() { document.getElementById('adminModal').classList.remove('hidden'); }
function closeAdminModal() { document.getElementById('adminModal').classList.add('hidden'); }

async function loginAdmin() {
  const pin = document.getElementById('adminPinInput').value;
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin })
  });
  const data = await res.json();
  if (data.success) {
    adminToken = data.token;
    document.getElementById('adminLoginForm').classList.add('hidden');
    document.getElementById('adminControls').classList.remove('hidden');
  } else {
    alert('Invalid PIN!');
  }
}

async function triggerForceCrash() {
  const targetMultiplier = document.getElementById('targetMultiplier').value;
  const res = await fetch('/api/admin/force-crash', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-admin-token': adminToken
    },
    body: JSON.stringify({ targetMultiplier })
  });
  const data = await res.json();
  alert(data.message || 'Crash Command Sent');
}
