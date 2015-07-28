angular.module('biblioApp')
    .config(function($routeProvider, $locationProvider) {
        $routeProvider
            .when("/", {
                templateUrl: 'inici.html',
                autoritzat: false
            })
            .when("/noullibre", {
                controller: "NouLlibreController",
                templateUrl: 'nouLlibre.html',
                autoritzat: true
            })
            .when("/llistatLlibres", {
                controller: "LlistatLlibresController",
                templateUrl: 'llistatLlibres.html',
                autoritzat: true
            })
            .when("/editLlibre", {
                controller: "EditLlibresController",
                templateUrl: 'editLlibre.html',
                autoritzat: true
            })
            .when("/login", {
                controller: "LoginController",
                templateUrl: "login.html",
                autoritzat: false
            })
            .when("/registrar", {
                controller: "RegisterController",
                templateUrl: "register.html",
                autoritzat: false
            })
            .otherwise({
                redirectTo: '/'
            });
            $locationProvider.html5Mode({
                          enabled: true,
                          requireBase: false
            });
    })
    .run(function($rootScope,UserSvc) {
        /*
            Cada vegada que canviem de pàgina se dispara el
            event $routeChangeStart,
            Si la pàgina que volem veure té la propietat 
            "autoritzat": a true i no ho està llavors no 
            farà el canvi
        */
        $rootScope.$on('$routeChangeStart', function(event, next) {
           if (next)
                if (!UserSvc.auth & next.autoritzat) 
                    event.preventDefault();
        });
    });