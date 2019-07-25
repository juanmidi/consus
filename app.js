var app = angular.module('cdg', [require('angular-route'),
	'angularUtils.directives.dirPagination', 'ui.bootstrap',
	require('angular-animate'), 'ui.bootstrap.contextMenu'
]);

app.config(function ($routeProvider) {
	$routeProvider
		.when("/", {
			templateUrl: "views/inicio.html",
			controller: "inicioController",
			access: {
				requiredLogin: false
			}
		})
		.when("/lista", {
			templateUrl: "views/pacientes.html",
			controller: "pacientesController",
			access: {
				requiredLogin: false
			}
		})
		.when("/paciente/:id", {
			templateUrl: "views/paciente.html",
			controller: "pacienteController",
			access: {
				requiredLogin: false
			}
		})
		.when("/config", {
			templateUrl: "views/config.html",
			controller: "configController",
			access: {
				requiredLogin: false
			}
		})
});