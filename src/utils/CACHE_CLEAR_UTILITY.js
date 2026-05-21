// ============================================================================
// 🔧 CACHE CLEARING UTILITY FOR MOBILE FIX
// Add this code to your src/App.js
// ============================================================================

/**
 * Add this useEffect to your App component to detect mobile and help clear cache
 */
function setupMobileCacheFix() {
  // Function to clear all caches (call this to debug)
  window.debugClearCache = async () => {
    console.log('🔧 Clearing all caches...');
    
    // Clear browser cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('Found caches:', cacheNames);
      
      for (const name of cacheNames) {
        await caches.delete(name);
        console.log(`✓ Deleted cache: ${name}`);
      }
    }
    
    // Tell service worker to clear cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CLEAR_CACHE'
      });
    }
    
    console.log('✓ All caches cleared!');
    console.log('🔄 Reloading page...');
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Function to get cache info
  window.debugCacheInfo = async () => {
    console.group('📊 Cache Info');
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('Service Worker Caches:', cacheNames);
      
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        console.log(`  ${name}: ${keys.length} items`);
      }
    }
    
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active) {
        console.log('Service Worker Active:', reg.active.scriptURL);
        console.log('Service Worker State:', reg.active.state);
      } else {
        console.log('⚠️ No active service worker');
      }
    }
    
    console.log('SessionStorage:', Object.keys(sessionStorage).length + ' items');
    console.log('LocalStorage:', Object.keys(localStorage).length + ' items');
    
    console.groupEnd();
  };

  // Function to update service worker
  window.debugUpdateServiceWorker = async () => {
    console.log('🔄 Checking for service worker updates...');
    
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        console.log('✓ Service worker update check completed');
      }
    }
  };

  // Auto-clear cache if user opens in private/incognito mode on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    console.log('📱 Mobile device detected');
    
    // Check if cache is stale (more than 1 hour old)
    const lastCacheTime = localStorage.getItem('wa_chat_last_cache_time');
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;
    
    if (lastCacheTime && now - parseInt(lastCacheTime) > oneHourMs) {
      console.log('⚠️ Cache is older than 1 hour, consider clearing...');
      // Don't auto-clear, just warn user
    }
    
    // Update last cache time
    localStorage.setItem('wa_chat_last_cache_time', String(now));
  }

  console.log('✅ Debug utilities loaded!');
  console.log('Available commands:');
  console.log('  debugCacheInfo() - Show cache information');
  console.log('  debugClearCache() - Clear all caches and reload');
  console.log('  debugUpdateServiceWorker() - Check for updates');
}

/**
 * Add this to your App.js useEffect:
 * 
 * useEffect(() => {
 *   setupMobileCacheFix();
 * }, []);
 */

// ============================================================================
// 🔧 ALTERNATIVE: Add a "Clear Cache" button to UI
// ============================================================================

import React from 'react';

export function CacheClearButton() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleClearCache = async () => {
    setLoading(true);
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CLEAR_CACHE'
        });
      }

      // Clear storage
      sessionStorage.clear();
      
      setSuccess(true);
      setLoading(false);
      
      // Reload after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Cache clear failed:', error);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        padding: '12px',
        background: '#00a884',
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        ✓ Cache cleared! Reloading...
      </div>
    );
  }

  return (
    <button
      onClick={handleClearCache}
      disabled={loading}
      style={{
        padding: '10px 16px',
        background: '#f59e0b',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1
      }}
    >
      {loading ? 'Clearing cache...' : 'Clear Cache & Reload'}
    </button>
  );
}

// ============================================================================
// 🔧 INSTRUCTIONS FOR USE
// ============================================================================

/**
 * 1. Copy the improved service worker:
 *    - Replace: public/service-worker.js
 *    - With: service-worker-FIXED.js
 *    - IMPORTANT: Change CACHE_VERSION to 'v2' after first deploy
 * 
 * 2. Add to your App.js:
 *    - Import setupMobileCacheFix
 *    - Call in useEffect:
 * 
 *      useEffect(() => {
 *        setupMobileCacheFix();
 *      }, []);
 * 
 * 3. (Optional) Add Clear Cache button to your UI:
 *    - Import CacheClearButton
 *    - Render it in a debug/settings panel
 * 
 * 4. Deploy and increment CACHE_VERSION:
 *    npm run build
 *    npm run deploy
 *    // Then change CACHE_VERSION in service-worker.js to 'v3'
 *    npm run deploy
 * 
 * 5. Test on mobile:
 *    - Open in incognito/private mode
 *    - Try all features (bookmarks, analytics, date range)
 *    - If still broken, user can click "Clear Cache & Reload"
 */

export { setupMobileCacheFix };
