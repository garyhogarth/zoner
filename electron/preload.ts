import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    // @ts-ignore
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args
        // @ts-ignore
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
    },
    // @ts-ignore
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args
        // @ts-ignore
        return ipcRenderer.off(channel, ...omit)
    },
    // @ts-ignore
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        // @ts-ignore
        return ipcRenderer.send(channel, ...omit)
    },
    // @ts-ignore
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        // @ts-ignore
        return ipcRenderer.invoke(channel, ...omit)
    },

    // You can expose other APTs you need here.
    // ...
})
