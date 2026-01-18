
import type { SavedLayout } from '../utils/layoutStore'
import { saveLayout } from '../utils/layoutStore'

export function exportLayoutAsJson(layout: SavedLayout) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layout, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${layout.name.replace(/\s+/g, '_').toLowerCase()}.json`)
    document.body.appendChild(downloadAnchorNode) // required for firefox
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
}

export function importLayoutFromJson(file: File, onComplete: (success: boolean, msg: string) => void) {
    const reader = new FileReader()
    reader.onload = (event) => {
        try {
            if (!event.target?.result) throw new Error("File empty")
            const json = JSON.parse(event.target.result as string)

            // Basic validation
            if (!json.name || !json.sources || !Array.isArray(json.sources)) {
                throw new Error("Invalid layout format")
            }

            // Save it (it will generate a new ID to avoid collisions)
            saveLayout(json.name + " (Imported)", json.windowSize || { width: 1920, height: 1080 }, json.sources)
            onComplete(true, "Layout imported successfully")
        } catch (err) {
            console.error(err)
            onComplete(false, "Failed to parse layout file")
        }
    }
    reader.readAsText(file)
}
