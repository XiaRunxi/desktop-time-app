import { app, shell, BrowserWindow, Menu, Tray, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/tray-icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    fullscreen: true, // 启用全屏模式
    // ...(process.platform === 'linux' ? { icon } : {}),
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true
    }
  })
  // 创建一个空的菜单并将其设置为应用程序菜单
  const emptyMenu = Menu.buildFromTemplate([])
  Menu.setApplicationMenu(emptyMenu)

  // 创建系统托盘图标
  const trayIconPath = icon

  const tray = new Tray(trayIconPath)

  // 创建系统托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开', click: () => mainWindow.show() },
    { label: '退出', click: () => app.quit() }
  ])

  // 设置系统托盘图标和菜单
  tray.setToolTip('Time')
  tray.setContextMenu(contextMenu)

  // 点击系统托盘图标时显示主窗口
  tray.on('click', () => mainWindow.show())

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 注册全局快捷键，捕获 ESC 键事件
  const ret = globalShortcut.register('Escape', () => {
    // 在这里执行按键事件的处理逻辑
    mainWindow.hide()
  })

  if (!ret) {
    console.log('register Escape error !!!', ret)
  }
  console.log(globalShortcut.isRegistered('Escape'))
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
