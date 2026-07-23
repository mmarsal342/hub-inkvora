import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { initDb, getDb } from './database'
import { registerIpcHandlers } from './ipc-handlers'

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
})

app.commandLine.appendSwitch('no-sandbox')
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'InkVora Hub',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false
    }
  })

  if (process.env.ELECTRON_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Catch renderer crashes
  // @ts-expect-error Electron 34 type mismatch for 'crashed' event
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('RENDERER CRASHED:', { killed })
  })
}

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  try {
    initDb()
    console.log('Database initialized successfully')
  } catch (dbErr) {
    console.error('Database init FAILED:', dbErr)
  }
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  try { getDb().close() } catch {}
})
