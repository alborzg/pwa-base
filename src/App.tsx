import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
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

  return (
    <div className="App">
      <header className="app-header">
        <h1>Progressive Web App</h1>
        <h2>Proof of Concept</h2>
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