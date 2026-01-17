import { HashRouter, Routes, Route } from 'react-router-dom'
import { SourceSelector } from './components/SourceSelector'
import { Preview } from './components/Preview'
import { Compositor } from './components/Compositor'
import { Home } from './components/Home'
import './App.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/single" element={<SourceSelector />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/compositor" element={<Compositor />} />
      </Routes>
    </HashRouter>
  )
}

export default App
