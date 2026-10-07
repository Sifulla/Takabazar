// Sandbox permission update to allow scripts, localstorage, same-origin
function loadGameIframe(gameUrl) {
  const container = document.getElementById('gameContainer');
  container.innerHTML = '';
  
  const iframe = document.createElement('iframe');
  iframe.src = gameUrl;
  iframe.className = 'game-iframe';
  // Allow localStorage, cookies, modules, popups and scripts
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
  iframe.setAttribute('allow', 'autoplay; fullscreen');
  
  container.appendChild(iframe);
}
