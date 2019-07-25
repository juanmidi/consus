"USE STRICT";
var remote = require('electron').remote; // Load remote compnent that contains the dialog dependency
var fs = require('fs');
var dialog = remote.require('dialog'); // Load the dialogs component of the OS
var path = require('path');
var html = require('html-escaper');


/////////////////////////////////////////////////////////
// // Importing this adds a right-click menu with 'Inspect Element' option
// var Menu = remote.require('menu');
// var MenuItem = remote.require('menu-item');

// var rightClickPosition = null;

// var menu = new Menu();
// var menuItem = new MenuItem({
// 	label: 'Inspect Element',
// 	click: () => {
// 		remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
// 	}
// })
// menu.append(menuItem);

// window.addEventListener('contextmenu', (e) => {
// 	e.preventDefault();
// 	rightClickPosition = {
// 		x: e.x,
// 		y: e.y
// 	}
// 	menu.popup(remote.getCurrentWindow());
// }, false);
/////////////////////////////////////////////////////////




app.controller("inicioController", function ($scope, $location, dbService) {
	dbService.runAsync("SELECT * FROM pacientes", function (data) {
		$scope.pacientes = data;
	});

	$scope.getPaciente = function (idPaciente) {
		console.log(idPaciente)
		$location.path('/paciente/' + idPaciente);
	}

	angular.element(document).ready(function () {
		$("#buscar").focus();
	})
})


app.controller("pacienteController", function ($scope, $routeParams, dbService, $timeout) {
	var imgFolder = remote.getGlobal('configuracion').imgFolder;
	var slashFolder = remote.getGlobal('configuracion').slashFolder;

	var idPaciente = ($routeParams.id) ? parseInt($routeParams.id) : 0;
	
	var original;


	$scope.buscarImagenes = function (dni) {
		var myDir = __dirname + imgFolder + dni;
		var arr = [];

		fs.readdirSync(myDir).forEach(file => {
			arr.push(file);
		});

		$scope.imagenes = arr;
		$scope.mydir = myDir;
		$scope.slashFolder = slashFolder;
	}

	$scope.seleccionar = function (id) {
		console.log(id)
		if ($('#' + id).parent().hasClass('bgcolor2')){
			$('#' + id).parent().removeClass('bgcolor2');
		} else {
			$('#' + id).parent().addClass('bgcolor2');
		}
	}
$scope.isImage = function (ext) {
	if (ext) {
		//console.log(ext.substring(ext.lastIndexOf('.') + 1))

		return ext == "jpg" || ext == "jpeg" || ext == "gif" || ext == "png";
	}
}

$scope.mostrarTostada = function (msg) {
	$('#msg').text(msg)
	$('#tostada').toast('show');
	console.log("tostadas: " + msg);
}


$scope.menuOptions = [
	// NEW IMPLEMENTATION
	{
		text: 'Cambiar Nombre',
		click: function ($itemScope, $event, modelValue, text, $li) {
			swal({
				title: "Cambiar nombre al archivo",
				text: "Escriba el nuevo nombre",
				type: "input",
				inputValue: $itemScope.imagen,
				showCancelButton: true,
				closeOnConfirm: true,
				inputPlaceholder: $itemScope.imagen
			}, function (inputValue) {
				if (inputValue === false) return false;
				if (inputValue === "") {
					swal.showInputError("ingrese un nombre para el archivo");
					return false;
				}
				console.log(inputValue)
				var file = __dirname + imgFolder + $scope.paciente.documento + slashFolder + $itemScope.imagen;
				var tmp=path.basename(file);
				var file2= file.replace(tmp,'');

				fs.renameSync(file, file2 + inputValue);

				$timeout(function () {
					$scope.buscarImagenes($scope.paciente.documento);
				}, 500);
			});

			
		}
	},
	{
		text: 'Borrar',
		click: function ($itemScope, $event, modelValue, text, $li) {
			console.log($itemScope.imagen)
			var file = __dirname + imgFolder + $scope.paciente.documento + slashFolder + $itemScope.imagen;
			 fs.unlinkSync(file);

			 $timeout(function () {
			 	$scope.buscarImagenes($scope.paciente.documento);
			 }, 500);
		}
	}
];

$scope.editarPaciente = function () {
	$('#editar-paciente').modal();
}

	$scope.cargarArchivo = function (documento) {
		// var imgFolder = remote.getGlobal('configuracion').imgFolder;
		dialog.showOpenDialog({
			properties: ['multiSelections']
		}, (fileNames) => {
			// fileNames is an array that contains all the selected
			if (fileNames === undefined) {
				console.log("No se seleccionaron archivos");
				return;
			}

			var nombreArchivo;
			for (var x in fileNames) {
				console.log(fileNames[x]);

				nombreArchivo = path.basename(fileNames[x]);
				fs.createReadStream(fileNames[x]).pipe(fs.createWriteStream(__dirname + imgFolder + documento + slashFolder + nombreArchivo));
				
				$scope.imagenes.push(nombreArchivo)
				
				console.log($scope.imagenes)
				

				// ruta = __dirname + imgFolder + documento + slashFolder + nombreArchivo;
				// ruta.replace('\\', '/');
				// console.log(ruta);

				// s = "<div class='card imagenes'>" +
				// 	" <img src = '" + imgFolder + documento + "/" + nombreArchivo + "'" +
				// 	" ng-dblclick='abrirArchivo(" + imgFolder + documento + "/" + nombreArchivo + ")'" +
				// 	" class='col-xs-4 img-fluid img-thumbnail' alt=''>" +
				// 	" <div class='card-body'>" +
				// 	" <p class='card-text'>{{imagen}}</p>" +
				// 	" </div>";

				// $("#imgcont").append(s)
			}
			$timeout(function () {
				$scope.buscarImagenes(documento);
			}, 500);
		})
	}

	$scope.abrirArchivo = function(path) {
		remote.shell.openItem(path);
	}



	dbService.runAsync("SELECT * FROM pacientes WHERE id=" + idPaciente, function (data) {
		// $scope.paciente = data[0];

		original = data[0];
		// original._id = AlumnoID;
		$scope.paciente = angular.copy(original);



		$scope.buscarImagenes($scope.paciente.documento);
		//carga los datos en motivo
		var motivo = $scope.paciente.motivo_consulta === null ? '' : $scope.paciente.motivo_consulta;
		var evolucion = $scope.paciente.evolucion === null ? '' : $scope.paciente.evolucion;
		$("#motivo").html(html.unescape(motivo));
		$("#evolucion").html(html.unescape(evolucion));
	});

	//Salvando
	$scope.salvar = function () {
		var msg, rows_modified;
		
		$scope.paciente.evolucion = html.escape($("#evolucion").trumbowyg('html'));
		$scope.paciente.motivo_consulta = html.escape($("#motivo").trumbowyg('html'));

		if ($scope.paciente.id) {
			var id = $scope.paciente.id;
			rows_modified = dbService.update('pacientes', $scope.paciente, {
				id: id
			})
		} else {
			dbService.insert('pacientes', $scope.paciente);
		}

		
		console.log(rows_modified)
		
		
		if (rows_modified) {
			msg="Cambios Guardados";
		} else {
			msg = "los cambios NO se guardaron";
		}

		$scope.mostrarTostada(msg);
		
	}

	$scope.fechar = function (id) {
		var f = new Date();
		fecha = f.getDate() + "/" + (f.getMonth() + 1) + "/" + f.getFullYear();
		var tmp = $('#' + id).trumbowyg('html');
		$('#' + id).trumbowyg('html', tmp + '<strong>' + fecha + '</strong>: ');
		console.log("fechar" + id)
	}

	$scope.isClean = function () {
		console.log(original)
		console.log($scope.paciente)
		return angular.equals(original, $scope.paciente);
	}

	$scope.modificarPaciente = function () {
		// var nombre= $('#nombre').val();
		// var apellido = $('#apellido').val();
		// var documento = $('#documento').val();

		$('#editar-paciente').modal('hide');
		$scope.salvar();



	}

	$scope.cancelarEdicion = function () {
		$scope.paciente.nombre = angular.copy(original.nombre);
		$scope.paciente.apellido = angular.copy(original.apellido);
		$scope.paciente.documento = angular.copy(original.documento);
	}


	angular.element(document).ready(function () {
		

		$("#motivo").trumbowyg({
			lang: 'es',
			semantic: true,
			removeformatPasted: true,
			btns: [
				['viewHTML'],
				['undo', 'redo'], // Only supported in Blink browsers
				['formatting'],
				['strong', 'em'],
				['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
				['unorderedList', 'orderedList'],
				['horizontalRule'],
				['fullscreen'],
				['fechar'],
				['guardar'],
			],
			btnsDef: {
				guardar: {
					fn: function () {
						$scope.salvar();
					},
					tag: 'tagName',
					title: 'Guardar',
					text: 'Guardar',
					isSupported: function () {
						return true;
					},
					key: 'G',
					param: '',
					forceCSS: false,
					class: '',
					hasIcon: false
				},
				fechar: {
					fn: function () {
						$scope.fechar('motivo');
					},
					tag: 'fechar',
					title: 'Fechar',
					text: 'Fechar',
					isSupported: function () {
						return true;
					},
					key: 'F',
					param: '',
					forceCSS: false,
					class: '',
					hasIcon: false
				}
			}
		});

		$("#evolucion").trumbowyg({
			lang: 'es',
			semantic: true,
			removeformatPasted: true,
			btns: [
				['viewHTML'],
				['undo', 'redo'], // Only supported in Blink browsers
				['formatting'],
				['strong', 'em'],
				['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
				['unorderedList', 'orderedList'],
				['horizontalRule'],
				['fullscreen'],
				['fechar'],
				['guardar']
			],
			btnsDef: {
				guardar: {
					fn: function () {
						$scope.salvar();
					},
					tag: 'tagName',
					title: 'Guardar',
					text: 'Guardar',
					isSupported: function () {
						return true;
					},
					key: 'K',
					param: '',
					forceCSS: false,
					class: '',
					hasIcon: false
				},
				fechar: {
					fn: function () {
						$scope.fechar('evolucion');
					},
					tag: 'fechar',
					title: 'Fechar',
					text: 'Fechar',
					isSupported: function () {
						return true;
					},
					key: 'P',
					param: '',
					forceCSS: false,
					class: '',
					hasIcon: false
				}
			}
		});
	})
})


app.controller("configController", function ($scope, $location, dbService) {


})

app.controller("pacientesController", function ($scope, $location, dbService) {
	//Listando

	$scope.listaPacientes = function () {
		dbService.runAsync("SELECT * FROM pacientes", function (data) {
			$scope.pacientes = data;
		});
	}

	// //Salvando
	// $scope.salvar = function(){
	// 	if($scope.paciente.id){
	// 		//Editar
	// 		var id = $scope.paciente.id;
	// 		delete $scope.paciente.id;
	// 		delete $scope.paciente.$$hashKey; //Apaga elemento $$hashKey do objeto
	// 		dbService.update('pacientes', $scope.paciente, {
	// 		  id: id
	// 		}); //entidade, dados, where
	// 	}else{
	// 		//nova
	// 		dbService.insert('pacientes', $scope.paciente); // entidade, dados
	// 	}
	// 	$scope.paciente = {};
	// 	$scope.listapacientes();
	// 	$('#modalPaciente').modal('hide');
	// }



	// //Abrindo para editar
	// $scope.editar = function(dados){
	// 	$scope.paciente = dados;
	// 	$('#modalPaciente').modal('show');
	// }

	// //Excluindo
	// $scope.excluir = function(dados){
	// 	if(confirm("Deseja realmente apagar o cadastro de "+dados.nome+"?")){
	// 		dbService.update('pacientes', {ativo:0}, {id: dados.id});
	// 		$scope.listaPacientes();
	// 	}
	// }
});