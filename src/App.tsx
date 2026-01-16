import { HashRouter, Routes, Route } from 'react-router-dom'
import { SourceSelector } from './components/SourceSelector'
import { Preview } from './components/Preview'
import './App.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SourceSelector />} />
        <Route path="/preview" element={<Preview />} />
      </Routes>
    </HashRouter>
  )
}

export default App
