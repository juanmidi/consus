"USE STRICT";





app.controller("pessoaController", function($scope, $location, dbService){
	//Listando
	$scope.listaPessoas = function(){
		dbService.runAsync("SELECT * FROM pessoas WHERE ativo = 1", function(data){
			$scope.pessoas = data;
		});
	}

	//Salvando
	$scope.salvar = function(){
		if($scope.pessoa.id){
			//Editar
			var id = $scope.pessoa.id;
			delete $scope.pessoa.id;
			delete $scope.pessoa.$$hashKey; //Apaga elemento $$hashKey do objeto
			dbService.update('pessoas', $scope.pessoa, {id: id}); //entidade, dados, where
		}else{
			//nova
			dbService.insert('pessoas', $scope.pessoa); // entidade, dados
		}
		$scope.pessoa = {};
		$scope.listaPessoas();
		$('#modalPessoa').modal('hide');
	}

	//Abrindo para editar
	$scope.editar = function(dados){
		$scope.pessoa = dados;
		$('#modalPessoa').modal('show');
	}

	//Excluindo
	$scope.excluir = function(dados){
		if(confirm("Deseja realmente apagar o cadastro de "+dados.nome+"?")){
			dbService.update('pessoas', {ativo:0}, {id: dados.id});
			$scope.listaPessoas();
		}
	}
});

//app.controller("poController", function () {
//	console.log("mono");
//})











//  app.controller('UploadController', function($scope, fileReader) {

//     $scope.mono = function () {

//         dialog.showOpenDialog((fileNames) => {
//             // fileNames is an array that contains all the selected
//             if(fileNames === undefined){
//                 console.log("No file selected");
//                 return;
//             }
//             console.log(fileNames[0])
//             var po=fileNames.toString();
     
            
//             fs.createReadStream('D:\\goma.jpg').pipe(fs.createWriteStream('D:\\destination.jpg'));

                
//         })

//     }
//     //$scope.imageSrc = "";
    
//     //$scope.$on("fileProgress", function(e, progress) {
//     //  $scope.progress = progress.loaded / progress.total;
//     //});
//   });




  app.directive("ngFileSelect", function(fileReader, $timeout) {
    return {
      scope: {
        ngModel: '='
      },
      link: function($scope, el) {
        function getFile(file) {
          fileReader.readAsDataUrl(file, $scope)
            .then(function(result) {
              $timeout(function() {
                $scope.ngModel = result;
              });
            });
        }

        el.bind("change", function(e) {
          var file = (e.srcElement || e.target).files[0];
          getFile(file);
        });
      }
    };
  });

app.factory("fileReader", function($q, $log) { 
  var onLoad = function(reader, deferred, scope) {
    return function() {
      scope.$apply(function() {
        deferred.resolve(reader.result);
      });
    };
  };

  var onError = function(reader, deferred, scope) {
    return function() {
      scope.$apply(function() {
        deferred.reject(reader.result);
      });
    };
  };

  var onProgress = function(reader, scope) {
    return function(event) {
      scope.$broadcast("fileProgress", {
        total: event.total,
        loaded: event.loaded
      });
    };
  };

  var getReader = function(deferred, scope) {
    var reader = new FileReader();
    reader.onload = onLoad(reader, deferred, scope);
    reader.onerror = onError(reader, deferred, scope);
    reader.onprogress = onProgress(reader, scope);
    return reader;
  };

  var readAsDataURL = function(file, scope) {
    var deferred = $q.defer();

    var reader = getReader(deferred, scope);
    reader.readAsDataURL(file);

    return deferred.promise;
  };

  return {
    readAsDataUrl: readAsDataURL
  };
});
    




/**
 * Promise based download file method
 */
function downloadFile(configuration){
    return new Promise(function(resolve, reject){
        // Save variable to know progress
        var received_bytes = 0;
        var total_bytes = 0;

        var req = request({
            method: 'GET',
            uri: configuration.remoteFile
        });

        var out = fs.createWriteStream(configuration.localFile);
        req.pipe(out);

        req.on('response', function ( data ) {
            // Change the total bytes value to get progress later.
            total_bytes = parseInt(data.headers['content-length' ]);
        });

        // Get progress if callback exists
        if(configuration.hasOwnProperty("onProgress")){
            req.on('data', function(chunk) {
                // Update the received bytes
                received_bytes += chunk.length;

                configuration.onProgress(received_bytes, total_bytes);
            });
        }else{
            req.on('data', function(chunk) {
                // Update the received bytes
                received_bytes += chunk.length;
            });
        }

        req.on('end', function() {
            resolve();
        });
    });
}




