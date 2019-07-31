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

	$scope.clean = function () {
		$("#buscar").val('');
	};

	angular.element(document).ready(function () {
		$("#buscar").focus();
	});
});

app.controller("mainController", function ($scope, $window, dbService) {
	$scope.atras = function () {
		$window.history.back();
		console.log("atras")
	}

	$scope.adelante = function () {
		$window.history.forward();
		console.log("adelante")
	}

	$scope.optimizarDb = function () {
			
		swal({
				title: "Optimizar la base de datos?",
				text: "Esto mejorará la performance de la app",
				type: "info",
				showCancelButton: true,
				confirmButtonText: "Sí",
				cancelButtonText: "No",
				closeOnConfirm: false,
				closeOnCancel: true
			},
			function (isConfirm) {
				if (isConfirm) {
					var sql = "vacuum";
					dbService.runAsync(sql, function (data) {
						console.log(data);
						if(data===true){
							swal("Hecho"," db optimizada", "success");
						} else {
							swal("Error compactando");
						}
					})
				}
			});
	}

})

app.controller("pacienteController", function ($scope, $routeParams, dbService, $timeout, $location) {
	var imgFolder = remote.getGlobal('configuracion').imgFolder;
	var slashFolder = remote.getGlobal('configuracion').slashFolder;
	var idPaciente = ($routeParams.id) ? parseInt($routeParams.id) : 0;
	var original;
	
	$scope.hasChanges = false;

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

	// Para seleccionar las imágenes en caso de realizar operaciones
	// con los archivos
	// No implementado
	// -------------------------------------------------------------
	$scope.seleccionar = function (id) {
		console.log(id)

		// $('.card').find('*').removeClass('bgcolor2');
		// $('#' + id).parent().addClass('bgcolor2');


		// if ($('#' + id).parent().hasClass('bgcolor2')) {
		// 	$('#' + id).parent().removeClass('bgcolor2');
		// } else {
		// 	$('#' + id).parent().addClass('bgcolor2');
		// }

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
			text: 'Abrir en Carpeta',
			click: function ($itemScope, $event, modelValue, text, $li) {
				var folder = __dirname + imgFolder + $scope.paciente.documento;
				remote.shell.openItem(folder);

				// $timeout(function () {

				// }, 500);
			}
		},
		{
			text: 'Borrar',
			click: function ($itemScope, $event, modelValue, text, $li) {
				swal({
						title: "¿Estás seguro?",
						text: "El archivo será eliminado!",
						type: "warning",
						showCancelButton: true,
						confirmButtonClass: "btn-danger",
						confirmButtonText: "Sí",
						cancelButtonText: "No",
						closeOnConfirm: true,
						closeOnCancel: true
					},
					function (isConfirm) {
						if (isConfirm) {
							console.log($itemScope.imagen)
							var file = __dirname + imgFolder + $scope.paciente.documento + slashFolder + $itemScope.imagen;
							fs.unlinkSync(file);

							$timeout(function () {
								$scope.buscarImagenes($scope.paciente.documento);
							}, 500);
						} 
					});
					
				
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
				$scope.mostrarTostada('Se guardaron las imágenes');
			}, 500);
		})
	}

	$scope.abrirArchivo = function (path) {
		remote.shell.openItem(path);
	}

	// $scope.popo = function () {
	// 	console.log($("#evolucion").html());
	// 	console.log($("#motivo").html());
	// 	console.log($("#antecedentes").html());
	// }

	//Salvando
	$scope.salvar = function () {
		var msg, rows_modified;
		
		$scope.paciente.evolucion = html.escape($("#evolucion").html());
		$scope.paciente.motivo_consulta = html.escape($("#motivo").html());
		$scope.paciente.antecedentes = html.escape($("#antecedentes").html());
		
		// desactivado porque no actualiza
		// $scope.paciente.evolucion = html.escape($("#evolucion").trumbowyg('html'));
		// $scope.paciente.motivo_consulta = html.escape($("#motivo").trumbowyg('html'));
		// $scope.paciente.antecedentes = html.escape($("#antecedentes").trumbowyg('html'));
				
		console.log("$scope.paciente después de asig")

		console.log($scope.paciente)

		if ($scope.paciente.id !== undefined && $scope.paciente.id !== 0) {
			var id = $scope.paciente.id;
			rows_modified = dbService.update('pacientes', $scope.paciente, {
				id: id
			})

			if (rows_modified) {
				msg = "Cambios Guardados";
				$scope.hasChanges = false;
			} else {
				msg = "los cambios NO se guardaron";
			}
			$scope.mostrarTostada(msg);
			console.log("$scope.hasChanges " + $scope.hasChanges)
		} else {
			var myDir = __dirname + imgFolder + $scope.paciente.documento;

			try {
				if (!fs.existsSync(myDir)) {
					fs.mkdirSync(myDir)
				}
			} catch (err) {
				// agregar alert
				console.error(err)
			}
			$scope.imagenes = [];
			var tmpId = dbService.insert('pacientes', $scope.paciente);
			$scope.paciente.id = tmpId;
			$scope.hasChanges = false;
		}
	}

	$scope.checarDocumento = function (documento) {
			if (documento == undefined || documento == '' || documento.length < 7) {
				$scope.digitosDocumento = true;
				return;
			} else {
				$scope.digitosDocumento = false;
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
		if (idPaciente !== 0 || idPaciente !== undefined) {
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
			if ($scope.paciente == undefined || $scope.paciente.id == undefined) {
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
				['fechar']
			],
			btnsDef: {
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

		$("#antecedentes").trumbowyg({
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
				['fechar']
			],
			btnsDef: {
				fechar: {
					fn: function () {
						$scope.fechar('antecedentes');
					},
					tag: 'fechar',
					title: 'Fechar',
					text: 'Fechar',
					isSupported: function () {
						return true;
					},
					key: 'H',
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
				['fechar']
			],
			btnsDef: {
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


$("#motivo").trumbowyg()
	.on('tbwchange', function () {
		console.log("motivo cambia")
		$scope.hasChanges=true;
		$scope.$apply();
	})

$("#antecedentes").trumbowyg()
	.on('tbwchange', function () {
		console.log("antecedentes cambia")
		$scope.hasChanges = true;
		$scope.$apply();
	})

$("#evolucion").trumbowyg()
	.on('tbwchange', function () {
		console.log("evolucion cambia")
		$scope.hasChanges = true;
		$scope.$apply();
	})

	// ***************************
	// detecta si agrega paciente nuevo o edita un paciente para agregar información
	// ***************************
	if (idPaciente == 0) {
		// si agrega paciente 
		$scope.tituloModal = 'Nuevo Paciente';
		$('#editar-paciente').modal();
	} else {
		// carga el paciente por su ID
		$scope.tituloModal = 'Editar Paciente';
		$scope.edicion=true;
		dbService.runAsync("SELECT * FROM pacientes WHERE id=" + idPaciente, function (data) {
			// $scope.paciente = data[0];
			original = data[0];
			// original._id = AlumnoID;
			$scope.paciente = angular.copy(original);
			
			console.log('inicio')
			console.log($scope.paciente)
			$scope.buscarImagenes($scope.paciente.documento);
			//carga los datos en motivo de consulta
			var motivo = $scope.paciente.motivo_consulta === null ? '' : $scope.paciente.motivo_consulta;
			var antecedentes = $scope.paciente.antecedentes === null ? '' : $scope.paciente.antecedentes;
			var evolucion = $scope.paciente.evolucion === null ? '' : $scope.paciente.evolucion;
			$("#motivo").html(html.unescape(motivo));
			$("#evolucion").html(html.unescape(evolucion));
			$("#antecedentes").html(html.unescape(antecedentes));
		});
	}



$scope.$on("$locationChangeStart", function (event, next) {
	console.log('mono ' + $scope.hasChanges)
	console.log(next)

	var tmp = next.split("#!");
	console.log(tmp[1])

	// if ($scope.form.$dirty && !confirm('You have unsaved changes, go back?'))
		if($scope.hasChanges){
			event.preventDefault();
			swal({
					title: "¿Sale sin guardar los cambios?",
					text: "Perderá los últimos cambios realizados",
					type: "warning",
					showCancelButton: true,
					confirmButtonClass: "btn-danger",
					cancelButtonText: "No",
					confirmButtonText: "Sí, salgo sin guardar",
					closeOnConfirm: true,
					closeOnCancel: true
				},
				function (isConfirm) {
					if (isConfirm) {
						$scope.hasChanges=false;
						$timeout(function () {
							$location.path(tmp[1]);
						}, 200);
					} 
				});

		}
		
});



})


app.controller("configController", function ($scope) {

})

app.controller("ayudaController", function ($scope) {

})

app.controller("pacientesController", function ($scope, $location, dbService, $timeout) {
	$scope.listaPacientes = function () {
		dbService.runAsync("SELECT * FROM pacientes", function (data) {
			$scope.pacientes = data;
		});
	}

	$scope.getPaciente = function (idPaciente) {
		$location.path('/paciente/' + idPaciente);
	};

	$scope.borrar = function (idPaciente, apell, nombre ) {
		if (idPaciente !== undefined) {
			swal({
					title: "¿Estás seguro?",
					text: "El paciente '" + apell + ", " + nombre + "' será eliminado y NO se podrá recuperar",
					type: "warning",
					showCancelButton: true,
					confirmButtonClass: "btn-danger",
					confirmButtonText: "Sí",
					cancelButtonText: "No",
					closeOnConfirm: true,
					closeOnCancel: true
				},
				function (isConfirm) {
					if (isConfirm) {
						dbService.run("DELETE FROM pacientes WHERE id=" + idPaciente);
						console.log(idPaciente);
						$timeout(function () {
							$scope.listaPacientes();
						}, 200);
					}
				});
		}		
	}
});