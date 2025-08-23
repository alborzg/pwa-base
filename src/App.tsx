import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineInteractions, setOfflineInteractions] = useState(0)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallButton(false)
    }
  }

  const handleOfflineInteraction = () => {
    setOfflineInteractions(prev => prev + 1)
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Progressive Web App</h1>
        <h2>Proof of Concept</h2>
        <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'} - 
          {isOnline ? ' Full functionality available' : ' Running from cache'}
        </div>
      </header>

      <main className="app-content">
        <section className="description">
          <h3>What is this?</h3>
          <p>This is a demonstration of a Progressive Web App (PWA) built with modern web technologies.</p>
        </section>

        <section className="features">
          <h3>PWA Features</h3>
          <ul>
            <li>📱 <strong>Installable</strong> - Add to your home screen like a native app</li>
            <li>⚡ <strong>Fast</strong> - Optimized performance with service workers</li>
            <li>🔄 <strong>Offline Ready</strong> - Works without internet connection</li>
            <li>📲 <strong>Responsive</strong> - Adapts to any screen size</li>
            <li>🔒 <strong>Secure</strong> - Served over HTTPS</li>
          </ul>
        </section>

        <section className="installation">
          <h3>How to Install</h3>
          <div className="install-instructions">
            <div className="platform">
              <h4>🖥️ Desktop (Chrome/Edge)</h4>
              <ul>
                <li>Look for the "Install" or "+" icon in the address bar</li>
                <li>Click it and select "Install"</li>
                <li>The app will be added to your desktop and start menu</li>
              </ul>
            </div>

            <div className="platform">
              <h4>🖥️ macOS Safari</h4>
              <ul>
                <li>Click "File" in the menu bar, then "Add to Dock"</li>
                <li>Or use the Share button and select "Add to Dock"</li>
                <li>The app will appear in your Dock as a standalone application</li>
                <li>Note: Requires Safari 14+ and macOS Big Sur or later</li>
              </ul>
            </div>
            
            <div className="platform">
              <h4>📱 Mobile (Android)</h4>
              <ul>
                <li>Tap the menu (⋮) in your browser</li>
                <li>Select "Add to Home screen" or "Install app"</li>
                <li>The app icon will appear on your home screen</li>
              </ul>
            </div>
            
            <div className="platform">
              <h4>🍎 Mobile (iOS)</h4>
              <ul>
                <li>Tap the Share button (□↗) in Safari</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Customize the name and tap "Add"</li>
              </ul>
            </div>
          </div>

          {showInstallButton && (
            <button onClick={handleInstallClick} className="install-button">
              📲 Install This App
            </button>
          )}
        </section>

        <section className="offline-demo">
          <h3>🔌 Offline Capabilities Demo</h3>
          <div className="demo-content">
            <p>
              <strong>Try this:</strong> Turn off your internet connection (or enable airplane mode) 
              and notice how this app continues to work! The service worker caches all the assets.
            </p>
            
            <div className="offline-counter">
              <button 
                onClick={handleOfflineInteraction}
                className="demo-button"
                disabled={false}
              >
                📱 Click Me {offlineInteractions > 0 && `(${offlineInteractions})`}
              </button>
              <p className="counter-text">
                This button works {isOnline ? 'online' : 'offline'}! 
                {!isOnline && offlineInteractions > 0 && (
                  <span className="offline-proof"> 
                    ✨ You clicked {offlineInteractions} time{offlineInteractions !== 1 ? 's' : ''} while offline!
                  </span>
                )}
              </p>
            </div>

            <div className="cache-status">
              <h4>📦 What's Cached & Available Offline:</h4>
              <ul>
                <li>✅ All HTML, CSS, and JavaScript</li>
                <li>✅ Persian lotus PWA icons</li>
                <li>✅ App functionality (buttons, counters, etc.)</li>
                <li>✅ This entire interface</li>
              </ul>
              
              <p className="cache-note">
                <strong>Service Worker Status:</strong> {isOnline ? 
                  'Active and ready for offline mode' : 
                  'Serving cached content - you\'re offline!'
                }
              </p>
            </div>
          </div>
        </section>

        <section className="tech-stack">
          <h3>Built With</h3>
          <div className="tech-badges">
            <span className="badge">React</span>
            <span className="badge">TypeScript</span>
            <span className="badge">Vite</span>
            <span className="badge">VitePWA</span>
            <span className="badge">Vercel</span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App