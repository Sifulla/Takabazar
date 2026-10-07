const fs = require('fs');
const path = require('path');

function detectEngineType(manifest, files) {
  // Enhanced Smart Engine Detection Logic
  if (manifest.engine) return manifest.engine;
  
  const hasCrashKeywords = files.some(f => 
    f.toLowerCase().includes('crash') || 
    f.toLowerCase().includes('skyrush') || 
    f.toLowerCase().includes('aviator')
  );

  // Check if explicitly slot
  const hasSlotKeywords = files.some(f => 
    f.toLowerCase().includes('slot') || 
    f.toLowerCase().includes('reel') || 
    f.toLowerCase().includes('spin')
  );

  if (hasCrashKeywords && !hasSlotKeywords) {
    return 'crash';
  }
  return 'generic'; // Defaults to generic slot/arcade engine
}

function registerGame(gamePath) {
  const files = fs.readdirSync(gamePath);
  let manifest = {};
  if (fs.existsSync(path.join(gamePath, 'manifest.json'))) {
    manifest = JSON.parse(fs.readFileSync(path.join(gamePath, 'manifest.json'), 'utf8'));
  }

  const engine = detectEngineType(manifest, files);
  return {
    id: path.basename(gamePath),
    engine,
    entry: manifest.main || 'index.html'
  };
}

module.exports = { registerGame };
