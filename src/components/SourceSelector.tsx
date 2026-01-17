import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface Source {
  id: string
  name: string
  thumbnail: string
  appIcon?: string | null
}

// Parse source name into app and title
function parseSourceName(source: Source): { app: string | null, title: string } {
  if (source.id.startsWith('screen:')) {
    // Screen names are usually like "Screen 1" or display names
    return { app: null, title: source.name }
  }
  
  // For windows, try to extract app name
  // Common patterns: "App Name - Title" or just "Title"
  const dashIndex = source.name.lastIndexOf(' - ')
  if (dashIndex > 0) {
    return {
      app: source.name.substring(dashIndex + 3), // App is often at the end
      title: source.name.substring(0, dashIndex)
    }
  }
  
  // No dash, check for common app patterns at start
  const knownApps = ['Google Chrome', 'Safari', 'Firefox', 'VS Code', 'Code', 'Slack', 'Discord', 'Finder', 'Terminal', 'iTerm']
  for (const app of knownApps) {
    if (source.name.startsWith(app + ' ')) {
      return { app, title: source.name.substring(app.length + 1) }
    }
    if (source.name === app) {
      return { app, title: app }
    }
  }
  
  return { app: null, title: source.name }
}

// Ticker text component with marquee on hover
function TickerText({ text, style }: { text: string, style?: React.CSSProperties }) {
  const [isHovered, setIsHovered] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldScroll, setShouldScroll] = useState(false)
  
  useEffect(() => {
    if (textRef.current && containerRef.current) {
      setShouldScroll(textRef.current.scrollWidth > containerRef.current.clientWidth)
    }
  }, [text])
  
  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        overflow: 'hidden',
        ...style,
      }}
    >
      <span
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: isHovered && shouldScroll ? 'marquee 4s linear infinite' : 'none',
        }}
      >
        {text}
      </span>
    </div>
  )
}

export function SourceSelector() {
  const [sources, setSources] = useState<Source[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSources = async () => {
      try {
        // @ts-ignore
        const availableSources = await window.ipcRenderer.invoke('get-sources')
        setSources(availableSources)
      } catch (e) {
        console.error('Failed to get sources', e)
        alert('Could not load screens. Check permissions.')
      }
    }
    fetchSources()
  }, [])

  // Split sources into screens and windows
  const screens = sources.filter(s => s.id.startsWith('screen:'))
  const windows = sources.filter(s => s.id.startsWith('window:'))

  const SourceCard = ({ source }: { source: Source }) => {
    const { app, title } = parseSourceName(source)
    
    return (
      <div 
        onClick={() => navigate(`/preview?sourceId=${source.id}`)}
        style={{
          cursor: 'pointer',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          borderRadius: '10px',
          padding: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease',
          maxWidth: '200px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
          e.currentTarget.style.transform = 'scale(1.02)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <div style={{
          width: '100%',
          height: '100px',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '8px',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}>
          <img 
            src={source.thumbnail} 
            alt={source.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 0.9,
            }}
          />
        </div>
        {/* 2-line name display */}
        <div style={{ textAlign: 'center', minHeight: '32px' }}>
          {app && (
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '2px',
            }}>
              {app}
            </div>
          )}
          <TickerText 
            text={title} 
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          />
        </div>
      </div>
    )
  }

  const Section = ({ title, items, icon }: { title: string, items: Source[], icon: string }) => (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingLeft: '4px',
      }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <h2 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          {title}
        </h2>
        <span style={{
          fontSize: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '2px 8px',
          borderRadius: '9999px',
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          {items.length}
        </span>
      </div>
      
      {items.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 200px))',
          gap: '12px',
        }}>
          {items.map(source => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      ) : (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '14px',
        }}>
          No {title.toLowerCase()} available
        </div>
      )}
    </div>
  )

  // Group windows by app name
  const groupedWindows = windows.reduce((groups, source) => {
    const { app } = parseSourceName(source)
    const groupName = app || 'Other'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(source)
    return groups
  }, {} as Record<string, Source[]>)

  // Sort groups alphabetically, with 'Other' at the end
  const sortedAppNames = Object.keys(groupedWindows).sort((a, b) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })

  const GroupedWindowsSection = () => (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingLeft: '4px',
      }}>
        <span style={{ fontSize: '20px' }}>🪟</span>
        <h2 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.7)',
          margin: 0,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          Windows
        </h2>
        <span style={{
          fontSize: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '2px 8px',
          borderRadius: '9999px',
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          {windows.length}
        </span>
      </div>
      
      {windows.length > 0 ? (
        <div>
          {sortedAppNames.map(appName => (
            <div key={appName} style={{ marginBottom: '20px' }}>
              {/* App header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                paddingLeft: '8px',
              }}>
                {/* App icon */}
                {groupedWindows[appName][0]?.appIcon && (
                  <img 
                    src={groupedWindows[appName][0].appIcon} 
                    alt="" 
                    style={{ width: '18px', height: '18px', borderRadius: '4px' }}
                  />
                )}
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.6)',
                }}>
                  {appName}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.3)',
                }}>
                  ({groupedWindows[appName].length})
                </div>
              </div>
              {/* Windows grid for this app */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 200px))',
                gap: '12px',
              }}>
                {groupedWindows[appName].map(source => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '14px',
        }}>
          No windows available
        </div>
      )}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a2e 100%)',
      color: 'white',
      padding: '40px',
      boxSizing: 'border-box',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '48px',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px',
        }}>
          Sub-Screen
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.5)',
          margin: 0,
        }}>
          Select a screen or window to share
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Section title="Screens" items={screens} icon="🖥️" />
        <GroupedWindowsSection />
      </div>

      {/* Footer hint */}
      <div style={{
        textAlign: 'center',
        marginTop: '32px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.3)',
      }}>
        Click a source to start preview
      </div>
    </div>
  )
}

