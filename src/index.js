const electron = require("electron");
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const ipcMain = electron.ipcMain;
const { desktopCapturer, remote } = require("electron");

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 960,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  require("@electron/remote/main").enable(mainWindow.webContents)
  require('@electron/remote/main').initialize()
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.send("ListenVideoSelectBtn", null);
  mainWindow.webContents.send("ListenOpenBtn", null);

  ipcMain.on("videoSelectBtnActivate", (event, data) => {
    async function getVideoSources() {
      const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"]
      });
      mainWindow.webContents.send("showVideoSources", inputSources);
    }
    getVideoSources()
  })
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});