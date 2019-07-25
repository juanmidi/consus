var remote = require('electron').remote; // Load remote compnent that contains the dialog dependency
var fs = require('fs');
var dialog = remote.require('dialog'); // Load the dialogs component of the OS
var path = require('path');

 app.controller('UploadController', function ($scope) {
  console.log()
    $scope.mono = function () {
        var imgFolder = remote.getGlobal('configuracion').imgFolder;
        dialog.showOpenDialog({
              properties: ['multiSelections']
            },(fileNames) => {
            // fileNames is an array that contains all the selected
            if(fileNames === undefined){
                console.log("No se seleccionaron archivos");
                return;
            }

            var nombreArchivo;
            for(var x in fileNames){
              console.log(fileNames[x]);
              
              nombreArchivo=path.basename(fileNames[x]);
              fs.createReadStream(fileNames[x]).pipe(fs.createWriteStream(__dirname + imgFolder + nombreArchivo));
            }
            
        })
    }
  });