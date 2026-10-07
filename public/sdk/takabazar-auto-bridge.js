(function () {
  console.log('[TakaBazar Universal Bridge Loaded]');

  // Global Wallet API for Native Game Script Access
  window.TakaBazarWallet = {
    getBalance: async function () {
      const res = await fetch('/api/wallet/balance');
      const data = await res.json();
      return data.balance || 0;
    },
    debit: async function (amount) {
      const res = await fetch('/api/wallet/debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (data.success) {
        window.TakaBazarBridge.updateUIBalance(data.balance);
      }
      return data;
    },
    credit: async function (amount) {
      const res = await fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (data.success) {
        window.TakaBazarBridge.updateUIBalance(data.balance);
      }
      return data;
    }
  };

  window.TakaBazarBridge = {
    updateUIBalance: function (bal) {
      // Universal Selector for Game Balance Text Elements
      const selectors = ['#balance', '#walletBalance', '.wallet-balance', '[data-balance]', '#userBalance', '.balance-text'];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.innerText = parseFloat(bal).toFixed(2);
        });
      });
    },

    bindAdminControls: function () {
      // Universal Binding for Admin Force Crash Action
      document.addEventListener('click', function (e) {
        const target = e.target.closest('#forceCrashBtn, [data-force-crash], [data-admin-action="force-crash"], .btn-force-crash');
        if (target) {
          fetch('/api/admin/force-crash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetMultiplier: 1.0 })
          }).then(res => res.json()).then(data => {
            alert(data.message || 'Force Crash Triggered');
          });
        }
      });
    }
  };

  // Initial Sync
  document.addEventListener('DOMContentLoaded', () => {
    window.TakaBazarWallet.getBalance().then(bal => window.TakaBazarBridge.updateUIBalance(bal));
    window.TakaBazarBridge.bindAdminControls();
  });
})();
