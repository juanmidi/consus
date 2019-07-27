"USE STRICT";
var remote = require('electron').remote;
var fs = require('fs');
var dialog = remote.require('dialog');
var path = require('path');
var html = require('html-escaper');

app.controller("inicioController", function ($scope, $location, dbService) {
	dbService.runAsync("SELECT * FROM pacientes", function (data) {
		$scope.pacientes = data;
	});

	$scope.getPaciente = function (idPaciente) {
		$location.path('/paciente/' + idPaciente);
	};

	angular.element(document).ready(function () {
		$("#buscar").focus();
	});
});

app.controller("pacienteController", function ($scope, $routeParams, dbService, $timeout, $location) {
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
		if ($('#' + id).parent().hasClass('bgcolor2')) {
			$('#' + id).parent().removeClass('bgcolor2');
		} else {
			$('#' + id).parent().addClass('bgcolor2');
		}
	}

	$scope.isImage = function (ext) {
		if (ext) {
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
					var tmp = path.basename(file);
					var file2 = file.replace(tmp, '');

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
		dialog.showOpenDialog({
			properties: ['openFile', 'multiSelections']
		}, (fileNames) => {
			// fileNames is an array that contains all the selected
			if (fileNames === undefined) {
				console.log("No se seleccionaron archivos");
				return;
			}

			var nombreArchivo;
			for (var x in fileNames) {
				nombreArchivo = path.basename(fileNames[x]);
				fs.createReadStream(fileNames[x]).pipe(fs.createWriteStream(__dirname + imgFolder + documento + slashFolder + nombreArchivo));
				$scope.imagenes.push(nombreArchivo)
			}
			$timeout(function () {
				$scope.buscarImagenes(documento);
			}, 500);
		})
	}

	$scope.abrirArchivo = function (path) {
		remote.shell.openItem(path);
	}

	//Salvando
	$scope.salvar = function () {
		var msg, rows_modified;
		$scope.paciente.evolucion = html.escape($("#evolucion").trumbowyg('html'));
		$scope.paciente.motivo_consulta = html.escape($("#motivo").trumbowyg('html'));
		if ($scope.paciente.id !== undefined && $scope.paciente.id !== 0) {
			var id = $scope.paciente.id;
			rows_modified = dbService.update('pacientes', $scope.paciente, {
				id: id
			})

			if (rows_modified) {
				msg = "Cambios Guardados";
			} else {
				msg = "los cambios NO se guardaron";
			}
			$scope.mostrarTostada(msg);

		} else {
			var myDir = __dirname + imgFolder + $scope.paciente.documento;

			try {
				if (!fs.existsSync(myDir)) {
					fs.mkdirSync(myDir)
				}
			} catch (err) {
				console.error(err)
			}
			$scope.imagenes = [];
			var tmpId = dbService.insert('pacientes', $scope.paciente);
			$scope.paciente.id = tmpId;
		}
	}

	$scope.checarDocumento = function (documento) {
			if (documento == undefined || documento == '' || documento.length < 7) {
				return;
			}
			dbService.runAsync("SELECT documento FROM pacientes WHERE documento=" + documento, function (data) {
				var res = data[0] === undefined ? undefined : data[0].documento;
				console.log(res)
				if (res === undefined) {
						$scope.existeUsuario = false;
					} else {
						$scope.existeUsuario = true;
					}
			})
	}

	$scope.fechar = function (id) {
		var f = new Date();
		fecha = f.getDate() + "/" + (f.getMonth() + 1) + "/" + f.getFullYear();
		var tmp = $('#' + id).trumbowyg('html');
		$('#' + id).trumbowyg('html', tmp + '<strong>' + fecha + '</strong>: ');
	}

	$scope.isClean = function () {
		return angular.equals(original, $scope.paciente);
	}

	$scope.modificarPaciente = function () {
		$('#editar-paciente').modal('hide');
		$scope.salvar();
	}

	$scope.cancelarEdicion = function () {
		if (idPaciente !== 0) {
			$scope.paciente.nombre = angular.copy(original.nombre);
			$scope.paciente.apellido = angular.copy(original.apellido);
			$scope.paciente.documento = angular.copy(original.documento);
		} else {
			$scope.paciente = {};
			$('#editar-paciente').modal('hide');
			$timeout(function () {
				$location.path('/');
			}, 200);
		}
	}

	angular.element(document).ready(function () {

		$('#editar-paciente').on('hidden.bs.modal', function (e) {
			if ($scope.paciente.id == 0) {
				$timeout(function () {
					$location.path('/');
				}, 200);
			}
		})

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

	if (idPaciente == 0) {
		// si agrega paciente 
		$('#editar-paciente').modal();
	} else {
		// carga el paciente por su ID
		dbService.runAsync("SELECT * FROM pacientes WHERE id=" + idPaciente, function (data) {
			// $scope.paciente = data[0];
			original = data[0];
			// original._id = AlumnoID;
			$scope.paciente = angular.copy(original);

			$scope.buscarImagenes($scope.paciente.documento);
			//carga los datos en motivo de consulta
			var motivo = $scope.paciente.motivo_consulta === null ? '' : $scope.paciente.motivo_consulta;
			var evolucion = $scope.paciente.evolucion === null ? '' : $scope.paciente.evolucion;
			$("#motivo").html(html.unescape(motivo));
			$("#evolucion").html(html.unescape(evolucion));
		});
	}
})


app.controller("configController", function ($scope, $location, dbService) {

})

app.controller("pacientesController", function ($scope, $location, dbService) {
	$scope.listaPacientes = function () {
		dbService.runAsync("SELECT * FROM pacientes", function (data) {
			$scope.pacientes = data;
		});
	}
});