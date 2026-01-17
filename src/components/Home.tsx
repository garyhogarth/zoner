import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
    }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        marginBottom: '12px',
        background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Sub-Screen
      </h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link 
          to="/single"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '160px',
            height: '160px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            textDecoration: 'none',
            color: 'white',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <span style={{ fontSize: '32px', marginBottom: '12px' }}>📺</span>
          <span style={{ fontWeight: 500 }}>Single Source</span>
        </Link>
        
        <Link 
          to="/compositor"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '160px',
            height: '160px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            textDecoration: 'none',
            color: 'white',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <span style={{ fontSize: '32px', marginBottom: '12px' }}>🪟</span>
          <span style={{ fontWeight: 500 }}>Compositor</span>
        </Link>
      </div>
    </div>
  )
}
