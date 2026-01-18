import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUnifiedSources, type Source } from '../utils/sources'
import { SourcePicker } from './SourcePicker'

export function SourceSelector() {
  const [sources, setSources] = useState<Source[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const availableSources = await fetchUnifiedSources()
        setSources(availableSources)
      } catch (e) {
        console.error('Failed to get sources', e)
        alert('Could not load screens. Check permissions.')
      }
    }
    fetchSources()
  }, [])

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
        <SourcePicker 
          sources={sources} 
          onSelect={(source) => navigate(`/preview?sourceId=${source.id}`)} 
        />
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


