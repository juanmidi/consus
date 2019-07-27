// var electron = require('electron');
var app = require('app');
var BrowserWindow = require('browser-window');
app.commandLine.appendSwitch ('ignore-certificate-errors', 'true');


// imgFolder: '/img/' Para Mac
global.configuracion = {
  imgFolder: '\\img\\',
  slashFolder: '\\'
};

// referencia global para mantener la instancia de la ventana hasta que el usuario la cierre, por lo que se cerrará cuando JavaScript realice la recolección de basura
var mainWindow = null;


// Salir de la aplicación cuando todas las ventanas están cerradas
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// app.on('window-all-closed', function () {
//       if (process.platform !== 'darwin') {
//         app.quit();
//       }
//     });

// app.on('before-quit', function () {
//   mainWindow.removeAllListeners('close');
//   mainWindow.close();
// });

app.on('ready', function() {
  // Crear la ventana del navegador.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 700,
    icon: __dirname + '/icon/icon.icns'
  });
  // mainWindow = new BrowserWindow({
  //   fullscreen: true
  // });
  
  mainWindow.setMenu(null)
  // Cargar el archivo html principal.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // aber o DevTools. (console, inspecionar elemento, etc)
   mainWindow.webContents.openDevTools(); 

  // Evento generado cuando se cierra la ventana, utilizada para destruir la instancia.
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});