import { useState, useEffect, useRef } from 'react'
import { type Source } from '../utils/sources'

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

interface SourcePickerProps {
  sources: Source[]
  onSelect: (source: Source) => void
  className?: string
  style?: React.CSSProperties
}

export function SourcePicker({ sources, onSelect, className, style }: SourcePickerProps) {
  // Split sources into screens, windows, and cameras
  const screens = sources.filter(s => s.id.startsWith('screen:'))
  const windows = sources.filter(s => s.id.startsWith('window:'))

  const SourceCard = ({ source }: { source: Source }) => {
    return (
      <div 
        onClick={() => onSelect(source)}
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
          position: 'relative',
        }}>
          {source.thumbnail === 'camera-placeholder' ? (
             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', color: '#666' }}>
               <span style={{ fontSize: '40px' }}>📷</span>
             </div>
          ) : (
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
          )}
          {/* App Icon Badge */}
          {source.appIcon && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              backgroundColor: '#222',
            }}>
              <img 
                src={source.appIcon} 
                alt="" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
        {/* Name display */}
        <div style={{ textAlign: 'center', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TickerText 
            text={source.name} 
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              width: '100%',
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

  return (
    <div 
      className={className}
      style={{
        width: '100%',
        color: 'white',
        boxSizing: 'border-box',
        overflowY: 'auto',
        ...style
      }}
    >
      <Section title="Screens" items={screens} icon="🖥️" />
      <Section title="Windows" items={windows} icon="🪟" />
    </div>
  )
}
