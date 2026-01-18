import { useState, useRef } from 'react'
import type { SavedLayout } from '../utils/layoutStore'
import { IconButton, Button } from './ui/Button'
import { Menu, MenuItem, MenuHeader, MenuSeparator } from './ui/Menu'
import { Tooltip } from './ui/Tooltip'
import { ConfirmDialog, AboutDialog } from './ui/Dialog'
import { exportLayoutAsJson, importLayoutFromJson } from '../utils/layoutIO'
import { clsx } from 'clsx'

interface LayerItem {
  instanceId: string
  name: string
  layerOrder: number
  isMissing?: boolean
  appIcon?: string | null
}

interface CompositorToolbarProps {
  visible: boolean
  // Layers
  layers: LayerItem[]
  onReorderLayer: (instanceId: string, direction: 'up' | 'down') => void
  onCloseLayer: (instanceId: string) => void
  // Layouts
  savedLayouts: SavedLayout[]
  onSaveLayout: (name: string) => void
  onLoadLayout: (layoutId: string) => void
  onDeleteLayout: (layoutId: string) => void
  // Add Source
  onAddSource: () => void
  // Refresh Layouts (needed for import)
  onLayoutsChanged?: () => void
}

type MenuState = 'layers' | 'settings' | null
type SettingsSubmenu = 'main' | 'layouts' | 'theme'

import { getStoredTheme, setTheme, THEMES, type ThemeId } from '../utils/themeStore'

export function CompositorToolbar({
  visible,
  layers,
  onReorderLayer,
  onCloseLayer,
  savedLayouts,
  onSaveLayout,
  onLoadLayout,
  onDeleteLayout,
  onAddSource,
  onLayoutsChanged
}: CompositorToolbarProps) {
  const [activeMenu, setActiveMenu] = useState<MenuState>(null)
  const [settingsView, setSettingsView] = useState<SettingsSubmenu>('main')
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getStoredTheme())
  const [isHovered, setIsHovered] = useState(false)
  
  // Refs
  const layersRef = useRef<HTMLButtonElement>(null)
  const settingsRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Layout Save State
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  
  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'delete' | 'overwrite'
    layoutId: string
    layoutName: string
  }>({ isOpen: false, type: 'delete', layoutId: '', layoutName: '' })
  
  // About Dialog State
  const [showAbout, setShowAbout] = useState(false)

  const isVisible = visible || isHovered || activeMenu !== null

  const handleSetTheme = (id: ThemeId) => {
    setTheme(id)
    setCurrentTheme(id)
  }

  const handleSaveNew = () => {
    if (saveName.trim()) {
      onSaveLayout(saveName.trim())
      setSaveName('')
      setShowSaveInput(false)
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      importLayoutFromJson(e.target.files[0], (success, msg) => {
        if (success) {
          onLayoutsChanged?.()
          // Maybe show a toast? For now just refresh list.
        } else {
          alert(msg) // Simple fallback
        }
      })
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const promptOverwrite = (layout: SavedLayout) => {
    setConfirmDialog({
      isOpen: true,
      type: 'overwrite',
      layoutId: layout.id,
      layoutName: layout.name
    })
  }

  const promptDelete = (layout: SavedLayout) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      layoutId: layout.id,
      layoutName: layout.name
    })
  }

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'delete') {
      onDeleteLayout(confirmDialog.layoutId)
    } else if (confirmDialog.type === 'overwrite') {
      onDeleteLayout(confirmDialog.layoutId)
      onSaveLayout(confirmDialog.layoutName)
    }
    setConfirmDialog({ ...confirmDialog, isOpen: false })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  // Sort layers
  const sortedLayers = [...layers].sort((a, b) => b.layerOrder - a.layerOrder)

  return (
    <>
      <div
        className={clsx(
          "fixed top-4 left-4 z-50 flex flex-col gap-2 transition-opacity duration-200",
          isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Toolbar */}
        <div className="flex gap-1 p-1.5 bg-[hsl(var(--background))]/80 backdrop-blur-md border border-[hsl(var(--border))] rounded-xl shadow-2xl">
          {/* Settings (Hamburger) */}
          <Tooltip content="Menu" side="right">
            <IconButton 
              ref={settingsRef}
              onClick={() => {
                setActiveMenu(activeMenu === 'settings' ? null : 'settings')
                setSettingsView('main')
              }}
              variant={activeMenu === 'settings' ? 'solid' : 'ghost'}
              className={activeMenu === 'settings' ? 'bg-blue-500/20 text-blue-400' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}
            >
              {/* Hamburger Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </IconButton>
          </Tooltip>

          <div className="w-px bg-[hsl(var(--border))] my-1" />

          {/* Add Source */}
          <Tooltip content="Add Source" side="right">
            <IconButton onClick={onAddSource} variant="ghost" className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </IconButton>
          </Tooltip>

          {/* Layers */}
          <Tooltip content="Layers" side="right">
            <IconButton 
              ref={layersRef}
              onClick={() => {
                setActiveMenu(activeMenu === 'layers' ? null : 'layers')
                setSettingsView('main')
              }}
              variant={activeMenu === 'layers' ? 'solid' : 'ghost'}
              className={activeMenu === 'layers' ? 'bg-blue-500/20 text-blue-400' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </IconButton>
          </Tooltip>
        </div>

        {/* Layers Menu */}
        <Menu 
          isOpen={activeMenu === 'layers'} 
          onClose={() => setActiveMenu(null)} 
          triggerRef={layersRef}
          placement="bottom-start"
          className="w-64 max-h-[400px] overflow-y-auto"
        >
          <MenuHeader>Layers ({layers.length})</MenuHeader>
          {sortedLayers.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-500 text-xs">No active sources</div>
          ) : (
            <div className="px-1 space-y-0.5">
              {sortedLayers.map((layer, index) => (
                <div 
                  key={layer.instanceId}
                  className={clsx(
                    "group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors",
                    layer.isMissing && "bg-red-500/10"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-[10px] text-zinc-500 shrink-0">
                    {layers.length - index}
                  </div>
                  
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                    {layer.appIcon ? (
                      <img src={layer.appIcon} className="w-3.5 h-3.5 rounded-sm" />
                    ) : (
                      <span className="text-xs">📺</span>
                    )}
                  </div>

                  <span className={clsx("flex-1 text-xs truncate", layer.isMissing ? "text-red-300" : "text-zinc-300")}>
                    {layer.name}
                  </span>

                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton 
                      size="sm" 
                      disabled={index === 0} 
                      onClick={(e) => { e.stopPropagation(); onReorderLayer(layer.instanceId, 'up') }}
                      className="w-5 h-5 text-zinc-500 hover:text-zinc-300"
                    >▲</IconButton>
                    <IconButton 
                      size="sm" 
                      disabled={index === sortedLayers.length - 1} 
                      onClick={(e) => { e.stopPropagation(); onReorderLayer(layer.instanceId, 'down') }}
                      className="w-5 h-5 text-zinc-500 hover:text-zinc-300"
                    >▼</IconButton>
                    <IconButton 
                      size="sm" 
                      variant="danger"
                      onClick={(e) => { e.stopPropagation(); onCloseLayer(layer.instanceId) }}
                      className="w-5 h-5"
                    >✕</IconButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Menu>

        {/* Settings Menu */}
        <Menu 
          isOpen={activeMenu === 'settings'} 
          onClose={() => setActiveMenu(null)} 
          triggerRef={settingsRef}
          placement="bottom-start"
          className="w-64"
        >
          {settingsView === 'main' ? (
            <>
              <MenuHeader>Settings</MenuHeader>
              <MenuItem 
                label="Layouts" 
                icon="💾" 
                hasSubmenu 
                onClick={() => setSettingsView('layouts')} 
              />
               <MenuItem 
                label="Theme" 
                icon="🎨" 
                hasSubmenu 
                onClick={() => setSettingsView('theme')} 
              />
              <MenuSeparator />
              <MenuItem label="Preferences" icon="⚙️" disabled />
              <MenuItem label="About" icon="ℹ️" onClick={() => { setShowAbout(true); setActiveMenu(null) }} />
            </>
          ) : settingsView === 'layouts' ? (
            <>
              <MenuItem 
                label="Back" 
                icon="←" 
                onClick={() => setSettingsView('main')} 
                className="sticky top-0 bg-zinc-900 border-b border-white/10 z-10"
              />
              <MenuHeader>Saved Layouts</MenuHeader>
              
              {/* Import/Save Controls */}
              <div className="p-2 border-b border-white/10 space-y-2">
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  className="hidden" 
                />

                {showSaveInput ? (
                  <div className="flex gap-1 animate-in fade-in zoom-in-95 duration-200">
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNew()}
                      placeholder="Name..."
                      autoFocus
                      className="flex-1 bg-white/5 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50"
                    />
                    <IconButton variant="solid" size="sm" onClick={handleSaveNew} className="bg-blue-600 hover:bg-blue-500">✓</IconButton>
                    <IconButton size="sm" onClick={() => setShowSaveInput(false)}>✕</IconButton>
                  </div>
                ) : (
                  <div className="flex gap-2">
                     <button 
                      onClick={() => setShowSaveInput(true)}
                       className="flex-1 py-1.5 px-2 rounded border border-dashed border-white/20 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>+</span> Save Current
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="py-1.5 px-3 rounded border border-white/10 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1"
                      title="Import JSON"
                    >
                      <span>📥</span>
                    </button>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="max-h-[250px] overflow-y-auto p-1">
                {savedLayouts.length === 0 ? (
                   <div className="py-6 text-center text-zinc-500 text-xs">No saved layouts</div>
                ) : (
                  savedLayouts.map(layout => (
                    <div key={layout.id} className="group flex items-center gap-2 px-2 py-2 rounded hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onLoadLayout(layout.id); setActiveMenu(null) }}>
                        <div className="text-13px text-zinc-200 font-medium truncate">{layout.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 flex flex-col gap-0.5">
                          <span>{layout.sources.length} sources</span>
                          <span>{layout.windowSize.width}x{layout.windowSize.height}</span>
                          <span className="opacity-75">{formatDate(layout.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Overwrite Button */}
                        <Tooltip content="Overwrite" side="top">
                           <IconButton 
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); promptOverwrite(layout) }}
                            className="text-zinc-500 hover:text-blue-400 h-6 w-6"
                          >
                            💾
                          </IconButton>
                        </Tooltip>

                         {/* Export Button */}
                         <Tooltip content="Export JSON" side="top">
                           <IconButton 
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); exportLayoutAsJson(layout) }}
                            className="text-zinc-500 hover:text-green-400 h-6 w-6"
                          >
                            📤
                          </IconButton>
                        </Tooltip>

                        {/* Load Button (Styled better) */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => { e.stopPropagation(); onLoadLayout(layout.id); setActiveMenu(null); }}
                          className="h-6 px-2 text-[10px] bg-white/10 hover:bg-blue-600 hover:text-white border border-white/5 mx-1"
                        >
                          Load
                        </Button>

                         {/* Delete Button */}
                        <IconButton 
                          size="sm" 
                          variant="danger"
                          onClick={(e) => { e.stopPropagation(); promptDelete(layout) }}
                          className="h-6 w-6 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          ✕
                        </IconButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : settingsView === 'theme' ? (
            <>
               <MenuItem 
                label="Back" 
                icon="←" 
                onClick={() => setSettingsView('main')} 
                className="sticky top-0 bg-zinc-900 border-b border-white/10 z-10"
              />
              <MenuHeader>Theme</MenuHeader>
              {THEMES.map(theme => (
                <MenuItem 
                  key={theme.id}
                  label={theme.name} 
                  icon={currentTheme === theme.id ? "✓" : <span className={`w-3 h-3 rounded-full bg-${theme.id === 'zinc' ? 'zinc-500' : theme.id === 'orange' ? 'orange-500' : `${theme.id}-600`}`} />}
                  active={currentTheme === theme.id}
                  onClick={() => handleSetTheme(theme.id)}
                />
              ))}
            </>
          ) : null}
        </Menu>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'delete' ? 'Delete Layout?' : 'Overwrite Layout?'}
        description={
          confirmDialog.type === 'delete' ? (
             <div className="space-y-2">
               <p>Are you sure you want to delete this layout? This action cannot be undone.</p>
               <div className="bg-black/20 p-2 rounded border border-white/5 text-xs">
                 <div className="font-medium text-white">{confirmDialog.layoutName}</div>
                 <div className="text-zinc-500 mt-1">
                   {/* We assume we can find the layout details? 
                       Actually confirmDialog state only has id/name. 
                       We should probably pass more info or find it here?
                       Ideally we update state to hold the full layout object or just pass display strings.
                       To keep it simple, I'll update the state usage above to find the layout if needed, 
                       or update the state type.
                       Wait, simple fix: Update the prompt calls to update more state?
                       Or just use what I have.
                       The user asked for details in confirmation.
                       Let's find the layout from savedLayouts list using layoutId.
                   */}
                   {(() => {
                     const layout = savedLayouts.find(l => l.id === confirmDialog.layoutId)
                     if (!layout) return null
                     return `${layout.sources.length} sources • ${layout.windowSize.width}x${layout.windowSize.height}`
                   })()}
                 </div>
               </div>
             </div>
          ) : (
            <div className="space-y-2">
               <p>Are you sure you want to overwrite this layout with the current window configuration?</p>
               <div className="bg-black/20 p-2 rounded border border-white/5 text-xs">
                 <div className="font-medium text-white">{confirmDialog.layoutName}</div>
                 <div className="text-zinc-500 mt-1">
                   {/* Show current details vs old details? Or just identify the target. */}
                   Target: {(() => {
                     const layout = savedLayouts.find(l => l.id === confirmDialog.layoutId)
                     if (!layout) return null
                     return `${layout.sources.length} sources • ${layout.windowSize.width}x${layout.windowSize.height}`
                   })()}
                 </div>
               </div>
             </div>
          )
        }
        confirmLabel={confirmDialog.type === 'delete' ? 'Delete' : 'Overwrite'}
        variant={confirmDialog.type === 'delete' ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* About Dialog */}
      <AboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  )
}

