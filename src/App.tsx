import { HashRouter, Routes, Route } from 'react-router-dom'
import { SourceSelector } from './components/SourceSelector'
import { Preview } from './components/Preview'
import { Compositor } from './components/Compositor'
import './App.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SourceSelector />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/compositor" element={<Compositor />} />
      </Routes>
    </HashRouter>
  )
}

export default App
