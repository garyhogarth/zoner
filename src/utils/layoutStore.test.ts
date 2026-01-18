// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { loadLayouts, saveLayout, type SavedSourceState } from './layoutStore'

describe('layoutStore', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        window.localStorage.clear()
    })

    const mockSource: SavedSourceState = {
        sourceId: 'test-source-1',
        sourceName: 'Test Source',
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        scale: 1,
        pan: { x: 0, y: 0 },
        viewMode: 'contain',
        layerOrder: 1
    }

    const mockWindowSize = { width: 1920, height: 1080 }

    it('should save layout to localStorage', () => {
        const layout = saveLayout('Test Layout', mockWindowSize, [mockSource])

        expect(layout.name).toBe('Test Layout')
        expect(layout.sources).toEqual([mockSource])

        const stored = window.localStorage.getItem('compositor-layouts')
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored!)
        expect(parsed).toHaveLength(1)
        expect(parsed[0].name).toBe('Test Layout')
    })

    it('should load layouts from localStorage', () => {
        saveLayout('Layout 1', mockWindowSize, [])
        saveLayout('Layout 2', mockWindowSize, [])

        const loaded = loadLayouts()
        expect(loaded).toHaveLength(2)
        expect(loaded[0].name).toBe('Layout 1')
        expect(loaded[1].name).toBe('Layout 2')
    })

    it('should return empty array if no layout stored', () => {
        const loaded = loadLayouts()
        expect(loaded).toEqual([])
    })

    it('should handle corrupted JSON gracefully', () => {
        window.localStorage.setItem('compositor-layouts', '{ invalid json')
        const loaded = loadLayouts()
        expect(loaded).toEqual([])
    })
})
