// var electron = require('electron');
var app = require('app');
var BrowserWindow = require('browser-window');
app.commandLine.appendSwitch ('ignore-certificate-errors', 'true');


// imgFolder: '/img/' Para Mac
global.configuracion = {
  imgFolder: '\\img\\',
  slashFolder: '\\'
};

// referência global para manter a instância da janela até que sejam fechadas pelo usuário então ele irá ser fechado quando o JavaScript fizer Garbage collection
var mainWindow = null;


// Sair da aplicação quando todas as janelas forem fechadas
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  // Cria a janela do browser.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 700,
    icon: __dirname + '/icon/icon.icns'
  });
  // mainWindow = new BrowserWindow({
  //   fullscreen: true
  // });
  
  mainWindow.setMenu(null)
  // Carrega o arquivo html principal.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // aber o DevTools. (console, inspecionar elemento, etc)
   mainWindow.webContents.openDevTools(); 

  // Evento emitido quando a janela é fechada, usado para destruir instancia.
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});