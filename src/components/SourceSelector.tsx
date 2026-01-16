import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Source {
  id: string
  name: string
  thumbnail: string
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

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Select a Screen to Share</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map(source => (
          <div 
            key={source.id} 
            className="group cursor-pointer border border-gray-700 rounded-lg p-2 hover:border-blue-500 transition-all bg-gray-800"
            onClick={() => navigate(`/preview?sourceId=${source.id}`)}
          >
            <img 
               src={source.thumbnail} 
               alt={source.name} 
               className="w-full h-auto rounded mb-2 opacity-80 group-hover:opacity-100"
            />
            <div className="font-medium text-center">{source.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
