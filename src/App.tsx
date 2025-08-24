import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineInteractions, setOfflineInteractions] = useState(0)
  const [connectionType, setConnectionType] = useState('unknown')
  const [lastOnlineCheck, setLastOnlineCheck] = useState(Date.now())
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [networkInfo, setNetworkInfo] = useState<any>({})
  const [fingerprint, setFingerprint] = useState<string>('')
  const [uniquenessScore, setUniquenessScore] = useState<number>(0)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Enhanced connectivity detection
  useEffect(() => {
    let pingInterval: number

    const checkRealConnectivity = async () => {
      try {
        // Try to fetch a small resource from your domain
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch('/favicon-16x16.png?t=' + Date.now(), {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          setIsOnline(true)
          setConnectionType('good')
          setLastOnlineCheck(Date.now())
        } else {
          setIsOnline(false)
          setConnectionType('poor')
        }
      } catch (error) {
        setIsOnline(false)
        setConnectionType('offline')
        console.log('Connectivity check failed:', error)
      }
    }

    const handleOnline = () => {
      setIsOnline(true)
      setConnectionType('checking')
      checkRealConnectivity()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setConnectionType('offline')
    }

    // Initial check
    checkRealConnectivity()

    // Set up periodic connectivity checks
    pingInterval = setInterval(checkRealConnectivity, 30000) // Check every 30 seconds

    // Listen to browser events (still useful for quick detection)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen to visibility changes (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() - lastOnlineCheck > 10000) {
        checkRealConnectivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(pingInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [lastOnlineCheck])

  // Gather device and network information
  useEffect(() => {
    const gatherDeviceInfo = async () => {
      const info: any = {}
      const netInfo: any = {}

      // Basic device info
      info.userAgent = navigator.userAgent
      info.platform = navigator.platform
      info.language = navigator.language
      info.languages = navigator.languages
      info.cookieEnabled = navigator.cookieEnabled
      info.onLine = navigator.onLine
      info.hardwareConcurrency = navigator.hardwareConcurrency || 'Unknown'

      // Screen information
      info.screenWidth = screen.width
      info.screenHeight = screen.height
      info.screenColorDepth = screen.colorDepth
      info.screenPixelDepth = screen.pixelDepth
      info.screenOrientation = screen.orientation?.type || 'Unknown'

      // Viewport information
      info.viewportWidth = window.innerWidth
      info.viewportHeight = window.innerHeight
      info.devicePixelRatio = window.devicePixelRatio

      // Memory information (if available)
      if ('deviceMemory' in navigator) {
        info.deviceMemory = (navigator as any).deviceMemory + ' GB'
      }

      // Network information (if available)
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        netInfo.effectiveType = connection.effectiveType || 'Unknown'
        netInfo.downlink = connection.downlink ? connection.downlink + ' Mbps' : 'Unknown'
        netInfo.rtt = connection.rtt ? connection.rtt + ' ms' : 'Unknown'
        netInfo.saveData = connection.saveData ? 'Enabled' : 'Disabled'
        
        // Listen for network changes
        connection.addEventListener('change', () => {
          setNetworkInfo({
            ...netInfo,
            effectiveType: connection.effectiveType || 'Unknown',
            downlink: connection.downlink ? connection.downlink + ' Mbps' : 'Unknown',
            rtt: connection.rtt ? connection.rtt + ' ms' : 'Unknown'
          })
        })
      }

      // Geolocation support
      info.geolocationSupported = 'geolocation' in navigator
      
      // Storage estimate (if available)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate()
          info.storageQuota = estimate.quota ? Math.round(estimate.quota / 1024 / 1024) + ' MB' : 'Unknown'
          info.storageUsage = estimate.usage ? Math.round(estimate.usage / 1024 / 1024) + ' MB' : 'Unknown'
        } catch (e) {
          info.storageQuota = 'Unavailable'
          info.storageUsage = 'Unavailable'
        }
      }

      // Permissions API
      if ('permissions' in navigator) {
        try {
          const notificationPermission = await navigator.permissions.query({name: 'notifications' as PermissionName})
          info.notificationPermission = notificationPermission.state
        } catch (e) {
          info.notificationPermission = 'Unavailable'
        }
      }

      // Service Worker support
      info.serviceWorkerSupported = 'serviceWorker' in navigator
      info.pushManagerSupported = 'PushManager' in window
      info.notificationSupported = 'Notification' in window

      setDeviceInfo(info)
      setNetworkInfo(netInfo)
      
      // Generate fingerprint
      generateFingerprint(info, netInfo)
    }

    gatherDeviceInfo()
  }, [])

  const generateFingerprint = async (deviceInfo: any, networkInfo: any) => {
    try {
      const components = []
      
      // Basic fingerprinting components
      components.push(deviceInfo.userAgent || '')
      components.push(`${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`)
      components.push(deviceInfo.screenColorDepth || '')
      components.push(deviceInfo.devicePixelRatio || '')
      components.push(deviceInfo.platform || '')
      components.push(deviceInfo.language || '')
      components.push(deviceInfo.hardwareConcurrency || '')
      components.push(new Date().getTimezoneOffset().toString())
      components.push(deviceInfo.cookieEnabled ? '1' : '0')
      
      // Network info
      components.push(networkInfo.effectiveType || '')
      
      // Canvas fingerprinting (simplified)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Browser fingerprint test 🔍', 2, 2)
        components.push(canvas.toDataURL().slice(-50)) // Last 50 chars
      }
      
      // WebGL fingerprinting (simplified)
      const webglCanvas = document.createElement('canvas')
      const gl = webglCanvas.getContext('webgl') as WebGLRenderingContext || webglCanvas.getContext('experimental-webgl') as WebGLRenderingContext
      if (gl) {
        const renderer = gl.getParameter(gl.RENDERER)
        const vendor = gl.getParameter(gl.VENDOR)
        components.push(renderer || '')
        components.push(vendor || '')
      }
      
      // Font detection (simplified)
      const testFonts = ['Arial', 'Times', 'Courier', 'Helvetica', 'Georgia']
      const availableFonts = testFonts.filter(font => {
        const span = document.createElement('span')
        span.style.fontFamily = font
        span.textContent = 'test'
        document.body.appendChild(span)
        const available = span.offsetWidth > 0
        document.body.removeChild(span)
        return available
      })
      components.push(availableFonts.join(','))
      
      // Audio context fingerprinting (simplified)
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioCtx.createOscillator()
          const analyser = audioCtx.createAnalyser()
          oscillator.connect(analyser)
          components.push(audioCtx.sampleRate.toString())
          audioCtx.close()
        } catch (e) {
          components.push('audio-unavailable')
        }
      }
      
      // Create hash from components
      const fingerprintString = components.join('|')
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprintString))
      const hashArray = Array.from(new Uint8Array(hash))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      setFingerprint(hashHex.slice(0, 16)) // First 16 chars for display
      
      // Calculate uniqueness score based on entropy of components
      let entropy = 0
      components.forEach(component => {
        if (component && component.length > 0) {
          // Simplified entropy calculation
          const uniqueChars = new Set(component).size
          entropy += Math.log2(uniqueChars + 1)
        }
      })
      
      // Convert to percentage (rough estimate)
      const maxEntropy = 50 // Theoretical max
      const uniquenessPercentage = Math.min(95, Math.max(60, (entropy / maxEntropy) * 100))
      setUniquenessScore(Math.round(uniquenessPercentage))
      
    } catch (error) {
      console.error('Fingerprinting failed:', error)
      setFingerprint('unavailable')
      setUniquenessScore(0)
    }
  }

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

  const handleManualConnectivityTest = async () => {
    setConnectionType('checking')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/favicon-16x16.png?manual-test=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        setIsOnline(true)
        setConnectionType('good')
        setLastOnlineCheck(Date.now())
      } else {
        setIsOnline(false)
        setConnectionType('poor')
      }
    } catch (error) {
      setIsOnline(false)
      setConnectionType('offline')
      console.log('Manual connectivity test failed:', error)
    }
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Progressive Web App</h1>
        <h2>Proof of Concept</h2>
        <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'} 
          {connectionType === 'checking' && ' (Verifying...)'}
          {connectionType === 'good' && ' - Full functionality'}
          {connectionType === 'poor' && ' - Connection issues'}
          {connectionType === 'offline' && ' - Running from cache'}
          {connectionType === 'unknown' && ' - Checking connection...'}
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
               <button 
                 onClick={handleManualConnectivityTest}
                 className="demo-button"
                 disabled={connectionType === 'checking'}
                 style={{ marginLeft: '1rem' }}
               >
                 {connectionType === 'checking' ? '⏳ Testing...' : '🔍 Test Connection'}
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

          <section className="device-info">
            <h3>📱 Device & Network Information</h3>
            <div className="info-grid">
              <div className="info-category">
                <h4>🖥️ Device Hardware</h4>
                <ul>
                  <li><strong>Platform:</strong> {deviceInfo.platform || 'Loading...'}</li>
                  <li><strong>CPU Cores:</strong> {deviceInfo.hardwareConcurrency || 'Loading...'}</li>
                  {deviceInfo.deviceMemory && <li><strong>RAM:</strong> {deviceInfo.deviceMemory}</li>}
                  <li><strong>Screen:</strong> {deviceInfo.screenWidth}×{deviceInfo.screenHeight}</li>
                  <li><strong>Viewport:</strong> {deviceInfo.viewportWidth}×{deviceInfo.viewportHeight}</li>
                  <li><strong>Pixel Ratio:</strong> {deviceInfo.devicePixelRatio || 'Loading...'}</li>
                  <li><strong>Orientation:</strong> {deviceInfo.screenOrientation}</li>
                </ul>
              </div>

              <div className="info-category">
                <h4>🌐 Network & Connection</h4>
                <ul>
                  <li><strong>Connection Type:</strong> {networkInfo.effectiveType || 'Unknown'}</li>
                  <li><strong>Download Speed:</strong> {networkInfo.downlink || 'Unknown'}</li>
                  <li><strong>Round Trip Time:</strong> {networkInfo.rtt || 'Unknown'}</li>
                  <li><strong>Data Saver:</strong> {networkInfo.saveData || 'Unknown'}</li>
                  <li><strong>Online Status:</strong> {isOnline ? 'Online' : 'Offline'}</li>
                </ul>
              </div>

              <div className="info-category">
                <h4>💾 Storage & Permissions</h4>
                <ul>
                  <li><strong>Storage Quota:</strong> {deviceInfo.storageQuota || 'Loading...'}</li>
                  <li><strong>Storage Used:</strong> {deviceInfo.storageUsage || 'Loading...'}</li>
                  <li><strong>Notifications:</strong> {deviceInfo.notificationPermission || 'Loading...'}</li>
                  <li><strong>Geolocation:</strong> {deviceInfo.geolocationSupported ? 'Supported' : 'Not supported'}</li>
                  <li><strong>Cookies:</strong> {deviceInfo.cookieEnabled ? 'Enabled' : 'Disabled'}</li>
                </ul>
              </div>

              <div className="info-category">
                <h4>🔧 Browser Capabilities</h4>
                <ul>
                  <li><strong>Service Workers:</strong> {deviceInfo.serviceWorkerSupported ? '✅ Supported' : '❌ Not supported'}</li>
                  <li><strong>Push Manager:</strong> {deviceInfo.pushManagerSupported ? '✅ Supported' : '❌ Not supported'}</li>
                  <li><strong>Notifications:</strong> {deviceInfo.notificationSupported ? '✅ Supported' : '❌ Not supported'}</li>
                  <li><strong>Language:</strong> {deviceInfo.language || 'Loading...'}</li>
                </ul>
              </div>
            </div>

            <div className="user-agent">
              <h4>🔍 User Agent</h4>
              <p className="user-agent-text">{deviceInfo.userAgent || 'Loading...'}</p>
            </div>
          </section>

          <section className="fingerprint-demo">
            <h3>🔍 Browser Fingerprinting Demo</h3>
            <div className="fingerprint-content">
              <div className="fingerprint-warning">
                <h4>⚠️ Privacy Notice</h4>
                <p>
                  This demonstrates how websites can potentially track users without cookies. 
                  This is for educational purposes only - we don't store or transmit this data.
                </p>
              </div>

              <div className="fingerprint-results">
                <div className="fingerprint-score">
                  <h4>🎯 Uniqueness Score</h4>
                  <div className="score-display">
                    <span className="score-number">{uniquenessScore}%</span>
                    <p className="score-explanation">
                      {uniquenessScore >= 90 && "Highly unique - easily trackable"}
                      {uniquenessScore >= 75 && uniquenessScore < 90 && "Quite unique - trackable"}
                      {uniquenessScore >= 60 && uniquenessScore < 75 && "Moderately unique - somewhat trackable"}
                      {uniquenessScore < 60 && "Low uniqueness - harder to track"}
                    </p>
                  </div>
                </div>

                <div className="fingerprint-hash">
                  <h4>🔐 Browser Fingerprint</h4>
                  <div className="hash-display">
                    <code className="fingerprint-code">{fingerprint || 'Calculating...'}</code>
                    <p className="hash-explanation">
                      This unique identifier is generated from your browser and device characteristics.
                      It changes when you update browsers, change settings, or use different devices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="fingerprint-components">
                <h4>📊 Tracking Components Used</h4>
                <div className="component-grid">
                  <div className="component-item">
                    <strong>User Agent:</strong> Browser and OS info
                  </div>
                  <div className="component-item">
                    <strong>Screen Resolution:</strong> {deviceInfo.screenWidth}×{deviceInfo.screenHeight}
                  </div>
                  <div className="component-item">
                    <strong>Timezone:</strong> {new Date().getTimezoneOffset()} minutes offset
                  </div>
                  <div className="component-item">
                    <strong>Language:</strong> {deviceInfo.language}
                  </div>
                  <div className="component-item">
                    <strong>Canvas Rendering:</strong> Graphics fingerprint
                  </div>
                  <div className="component-item">
                    <strong>WebGL Info:</strong> GPU details
                  </div>
                  <div className="component-item">
                    <strong>Audio Context:</strong> Audio processing capabilities
                  </div>
                  <div className="component-item">
                    <strong>Available Fonts:</strong> Installed font detection
                  </div>
                </div>
              </div>

              <div className="privacy-protection">
                <h4>🛡️ How to Protect Your Privacy</h4>
                <ul>
                  <li><strong>Use Privacy-Focused Browsers:</strong> Firefox, Brave, or Safari with tracking protection</li>
                  <li><strong>Enable Fingerprint Protection:</strong> Most modern browsers have anti-fingerprinting features</li>
                  <li><strong>Use VPN:</strong> Masks your IP and some location-based tracking</li>
                  <li><strong>Disable JavaScript:</strong> (Not practical, but stops most fingerprinting)</li>
                  <li><strong>Use Incognito/Private Mode:</strong> Provides some protection</li>
                  <li><strong>Browser Extensions:</strong> uBlock Origin, Privacy Badger</li>
                </ul>
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