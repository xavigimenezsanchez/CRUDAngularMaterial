angular.module('biblioApp',['ngResource','ngRoute']);
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
angular.module('biblioApp')
    .controller("BiblioController", function($scope,$location,UserSvc) {
        $scope.$on('login', function(e,user) {
            /*
                Quan s'ha fet login s'emet l'event "login"
                i això fa que la variable de l'scope "currentUser"
                li diem quin usuari s'ha autenticant, d'aquesta manera
                fem que apareguin diferents opcions al menú
            */
            $scope.currentUser = user;
        });
        $scope.logout = function(){
            /*
                Quan fem logout esborrem el token i la variable
                de l'$scope "currentUser", d'aquesta forma desapareixen
                els menús sensibles a la autenticació
            */
            UserSvc.logOut();
            delete $scope.currentUser;
            $location.path('/');
        };
    });
    
angular.module('biblioApp')
.factory("LlibresServer", function($resource) {
    this.srv = $resource("/api/llibres/:id", null,
    {
        'update': { method:'PUT' }
    });
    
    this.edit = null;
    return this;
});
angular.module('biblioApp')
    .service('UserSvc', function($http) {
        var srv = this;
        srv.auth= false;
        srv.getUser = function() {
            return $http.get('/api/users');
        };
        srv.login = function (username, password,noLogin) {
            return $http.post('/api/sessions', {
                username: username,
                password: password
            }).success(function(data,status) {
                /*
                    Si l'autenticació és correcte li diem a l'angular que cada 
                    vegada que es comuniqui amb el servidor afegeixi el token 
                    al header 'x-auth'
                */
                $http.defaults.headers.common['x-auth'] = data;
                if (data) srv.auth = true;
            }).error(function(error,status){
                /*
                    Si l'usuari i contrasenya no és correcte executa la
                    función callback que li hem passat com paràmetre
                */
                noLogin(error, status);
            });
        };
        srv.registre = function(username,password, noRegister){
            /*
                Per registrar un usuari nou, només hem de fer un post
                a l'api d'usuaris
            */
            return $http.post('/api/users', {
                username: username,
                password: password
            }).error(function(error,status) {
                noRegister(error,status);
            });
        };
        this.logOut = function() {
            /*
                Quan l'usuari fa logout s'esborra el token
                i posem la propietat del servei "auth" a false
            */
            srv.auth = false;
            $http.defaults.headers.common['x-auth'] ="";
        };
    });
angular.module('biblioApp')
    .controller('EditLlibresController',function($scope,$location,LlibresServer) {
         $scope.$watchGroup(['editTitol','editIsbnq'],function(newVal, oldVal) {
                if (newVal!=oldVal && newVal!=null)
                    $scope.error=null;
                    $scope.missatge=null;
            });
        $scope.error = null;
        $scope.missatge = null;
        $scope.editIsbn = LlibresServer.edit.isbn;
        $scope.editTitol = LlibresServer.edit.titol;
        $scope.$watchGroup(['nouTitol','nouIsbn'],function(newVal, oldVal) {
                if (newVal!=oldVal && newVal!=null)
                    $scope.error=null;
                    $scope.missatge=null;
            });
        $scope.editar = function(patata) {
            if ($scope.editTitol && $scope.editIsbn ){
                LlibresServer.srv.update({
                    llibreEditar: LlibresServer.edit,  //llibre original
                    editar: { //canvis fet al llibre
                        titol:$scope.editTitol,
                        isbn: $scope.editIsbn
                    }
                }, function() {
                    $scope.missatge= "Llibre editat";
                },function(err) {
                    $scope.error = err.data.missatge;
                });
            }
        };
        $scope.cancelar = function() {
            $location.path('/llistatLlibres');
        };
    });
angular.module('biblioApp')
    .controller('LlistatLlibresController',function($scope,$location,LlibresServer) {
        LlibresServer.srv.query(function(llibres){
            $scope.llibres = llibres;
        });
        
        $scope.esborrar = function(llibre) {
            LlibresServer.srv.delete({id:llibre.isbn},function(res) {
                if (res.$resolved) {
                    $scope.llibres.splice($scope.llibres.indexOf(llibre),1);
                }
            });
        };
        $scope.editar = function(llibre) {
            LlibresServer.edit = llibre;
            $location.path('/editLlibre');
        };
    });
angular.module('biblioApp')
    .controller('NouLlibreController',function($scope,$location,LlibresServer) {
        $scope.error = null;
        $scope.missatge = null;
        $scope.$watchGroup(['nouTitol','nouIsbn'],function(newVal, oldVal) {
                if (newVal!=oldVal && newVal!=null)
                    $scope.error=null;
                    $scope.missatge=null;
            });
        $scope.guardar = function(patata) {
            if ($scope.nouTitol && $scope.nouIsbn ){
                LlibresServer.srv.save({
                    titol:$scope.nouTitol,
                    isbn: $scope.nouIsbn
                }, function() {
                    $scope.nouIsbn=null;
                    $scope.nouTitol=null;
                    $scope.missatge= "Llibre creat";
                },function(err) {
                    $scope.error = err.data.missatge;
                });
            }
        };
        $scope.cancelar = function() {
          $scope.nouIsbn = null;
          $scope.nouTitol = null;
        };
    });
angular.module('biblioApp')
    .controller("LoginController", function($scope,$location,UserSvc) {
         $scope.$watchGroup(['username','password'],function(newVal, oldVal) {
                /*
                 * Vigilem les variables de l'$scope "username"
                 * i "password" per esborrar el missatge d'error
                 * si hi ha.
                 */
                if (newVal!=oldVal)
                    $scope.error=null;
                
            });
        $scope.login = function(username,password) {
            if (!username || !password) {
                $scope.error = "Has d'emplenar tots els camps";
            } else{
                UserSvc.login(username,password,
                    function(error,status) {
                        /*
                            Funció que s'executarà si hi ha un error en el login
                        */
                        if (status == 401) {
                                $scope.error = error.missatge;
                        }
                    }).success(function() {
                        UserSvc.getUser().then(function(user){
                            /*
                                Si tot va bé, anem a la pàgina principal
                                i emeten un missatge de "login" per avisar
                                a la nostra app que l'usuari ha fet login
                                correctament.
                            */
                            $scope.$emit('login', user.data);  
                            $location.path('/');
                        });
                    });
            }
        };
    });
angular.module('biblioApp')
    .controller("RegisterController",function($scope,$location,UserSvc) {
        
        $scope.registrar = function() {
            if ($scope.username == null || $scope.password == null || $scope.password2 == null) {
                    $scope.error = "Has d'emplenar tots els camps";
            } else if ($scope.password != $scope.password2) {
                $scope.error = "Les contrasenyes no coincideixen";
            } else {
                UserSvc.srv.registre($scope.username,$scope.password,
                    function(error,status) {
                        /*
                            Funció que s'executarà si hi ha un error en el login
                        */
                        if (status == 401) {
                                $scope.error = error.missatge;
                        }
                    });
            }
        };
    });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZS5qcyIsInJvdXRlcy5qcyIsImNvbnRyb2xsZXJzL2JpYmxpby5jdHJsLmpzIiwic2VydmVpcy9sbGlicmVzLnNydi5qcyIsInNlcnZlaXMvdXNlci5zcnYuanMiLCJjb250cm9sbGVycy9sbGlicmVzL2VkaXRMbGlicmUuY3RybC5qcyIsImNvbnRyb2xsZXJzL2xsaWJyZXMvbGxpc3RhdExsaWJyZXMuY3RybC5qcyIsImNvbnRyb2xsZXJzL2xsaWJyZXMvbm91TGxpYnJlLmN0cmwuanMiLCJjb250cm9sbGVycy9sb2dpbi9sb2dpbi5jdHJsLmpzIiwiY29udHJvbGxlcnMvcmVnaXN0ZXIvcmVnaXN0ZXIuY3RybC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2JpYmxpb0FwcCcsWyduZ1Jlc291cmNlJywnbmdSb3V0ZSddKTsiLCJhbmd1bGFyLm1vZHVsZSgnYmlibGlvQXBwJylcbiAgICAuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgICAgICAkcm91dGVQcm92aWRlclxuICAgICAgICAgICAgLndoZW4oXCIvXCIsIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2luaWNpLmh0bWwnLFxuICAgICAgICAgICAgICAgIGF1dG9yaXR6YXQ6IGZhbHNlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLndoZW4oXCIvbm91bGxpYnJlXCIsIHtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIk5vdUxsaWJyZUNvbnRyb2xsZXJcIixcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ25vdUxsaWJyZS5odG1sJyxcbiAgICAgICAgICAgICAgICBhdXRvcml0emF0OiB0cnVlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLndoZW4oXCIvbGxpc3RhdExsaWJyZXNcIiwge1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiTGxpc3RhdExsaWJyZXNDb250cm9sbGVyXCIsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdsbGlzdGF0TGxpYnJlcy5odG1sJyxcbiAgICAgICAgICAgICAgICBhdXRvcml0emF0OiB0cnVlXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLndoZW4oXCIvZWRpdExsaWJyZVwiLCB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogXCJFZGl0TGxpYnJlc0NvbnRyb2xsZXJcIixcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2VkaXRMbGlicmUuaHRtbCcsXG4gICAgICAgICAgICAgICAgYXV0b3JpdHphdDogdHJ1ZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC53aGVuKFwiL2xvZ2luXCIsIHtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIkxvZ2luQ29udHJvbGxlclwiLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcImxvZ2luLmh0bWxcIixcbiAgICAgICAgICAgICAgICBhdXRvcml0emF0OiBmYWxzZVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC53aGVuKFwiL3JlZ2lzdHJhclwiLCB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogXCJSZWdpc3RlckNvbnRyb2xsZXJcIixcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJyZWdpc3Rlci5odG1sXCIsXG4gICAgICAgICAgICAgICAgYXV0b3JpdHphdDogZmFsc2VcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub3RoZXJ3aXNlKHtcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvOiAnLydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZUJhc2U6IGZhbHNlXG4gICAgICAgICAgICB9KTtcbiAgICB9KVxuICAgIC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSxVc2VyU3ZjKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAgICBDYWRhIHZlZ2FkYSBxdWUgY2FudmllbSBkZSBww6BnaW5hIHNlIGRpc3BhcmEgZWxcbiAgICAgICAgICAgIGV2ZW50ICRyb3V0ZUNoYW5nZVN0YXJ0LFxuICAgICAgICAgICAgU2kgbGEgcMOgZ2luYSBxdWUgdm9sZW0gdmV1cmUgdMOpIGxhIHByb3BpZXRhdCBcbiAgICAgICAgICAgIFwiYXV0b3JpdHphdFwiOiBhIHRydWUgaSBubyBobyBlc3TDoCBsbGF2b3JzIG5vIFxuICAgICAgICAgICAgZmFyw6AgZWwgY2FudmlcbiAgICAgICAgKi9cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRyb3V0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIG5leHQpIHtcbiAgICAgICAgICAgaWYgKG5leHQpXG4gICAgICAgICAgICAgICAgaWYgKCFVc2VyU3ZjLmF1dGggJiBuZXh0LmF1dG9yaXR6YXQpIFxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICB9KTsiLCJhbmd1bGFyLm1vZHVsZSgnYmlibGlvQXBwJylcbiAgICAuY29udHJvbGxlcihcIkJpYmxpb0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHNjb3BlLCRsb2NhdGlvbixVc2VyU3ZjKSB7XG4gICAgICAgICRzY29wZS4kb24oJ2xvZ2luJywgZnVuY3Rpb24oZSx1c2VyKSB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgIFF1YW4gcydoYSBmZXQgbG9naW4gcydlbWV0IGwnZXZlbnQgXCJsb2dpblwiXG4gICAgICAgICAgICAgICAgaSBhaXjDsiBmYSBxdWUgbGEgdmFyaWFibGUgZGUgbCdzY29wZSBcImN1cnJlbnRVc2VyXCJcbiAgICAgICAgICAgICAgICBsaSBkaWVtIHF1aW4gdXN1YXJpIHMnaGEgYXV0ZW50aWNhbnQsIGQnYXF1ZXN0YSBtYW5lcmFcbiAgICAgICAgICAgICAgICBmZW0gcXVlIGFwYXJlZ3VpbiBkaWZlcmVudHMgb3BjaW9ucyBhbCBtZW7DulxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50VXNlciA9IHVzZXI7XG4gICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgUXVhbiBmZW0gbG9nb3V0IGVzYm9ycmVtIGVsIHRva2VuIGkgbGEgdmFyaWFibGVcbiAgICAgICAgICAgICAgICBkZSBsJyRzY29wZSBcImN1cnJlbnRVc2VyXCIsIGQnYXF1ZXN0YSBmb3JtYSBkZXNhcGFyZWl4ZW5cbiAgICAgICAgICAgICAgICBlbHMgbWVuw7pzIHNlbnNpYmxlcyBhIGxhIGF1dGVudGljYWNpw7NcbiAgICAgICAgICAgICovXG4gICAgICAgICAgICBVc2VyU3ZjLmxvZ091dCgpO1xuICAgICAgICAgICAgZGVsZXRlICRzY29wZS5jdXJyZW50VXNlcjtcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvJyk7XG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgIiwiYW5ndWxhci5tb2R1bGUoJ2JpYmxpb0FwcCcpXG4uZmFjdG9yeShcIkxsaWJyZXNTZXJ2ZXJcIiwgZnVuY3Rpb24oJHJlc291cmNlKSB7XG4gICAgdGhpcy5zcnYgPSAkcmVzb3VyY2UoXCIvYXBpL2xsaWJyZXMvOmlkXCIsIG51bGwsXG4gICAge1xuICAgICAgICAndXBkYXRlJzogeyBtZXRob2Q6J1BVVCcgfVxuICAgIH0pO1xuICAgIFxuICAgIHRoaXMuZWRpdCA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYmlibGlvQXBwJylcbiAgICAuc2VydmljZSgnVXNlclN2YycsIGZ1bmN0aW9uKCRodHRwKSB7XG4gICAgICAgIHZhciBzcnYgPSB0aGlzO1xuICAgICAgICBzcnYuYXV0aD0gZmFsc2U7XG4gICAgICAgIHNydi5nZXRVc2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXJzJyk7XG4gICAgICAgIH07XG4gICAgICAgIHNydi5sb2dpbiA9IGZ1bmN0aW9uICh1c2VybmFtZSwgcGFzc3dvcmQsbm9Mb2dpbikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvc2Vzc2lvbnMnLCB7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgICAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhLHN0YXR1cykge1xuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgIFNpIGwnYXV0ZW50aWNhY2nDsyDDqXMgY29ycmVjdGUgbGkgZGllbSBhIGwnYW5ndWxhciBxdWUgY2FkYSBcbiAgICAgICAgICAgICAgICAgICAgdmVnYWRhIHF1ZSBlcyBjb211bmlxdWkgYW1iIGVsIHNlcnZpZG9yIGFmZWdlaXhpIGVsIHRva2VuIFxuICAgICAgICAgICAgICAgICAgICBhbCBoZWFkZXIgJ3gtYXV0aCdcbiAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWyd4LWF1dGgnXSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEpIHNydi5hdXRoID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKGVycm9yLHN0YXR1cyl7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgU2kgbCd1c3VhcmkgaSBjb250cmFzZW55YSBubyDDqXMgY29ycmVjdGUgZXhlY3V0YSBsYVxuICAgICAgICAgICAgICAgICAgICBmdW5jacOzbiBjYWxsYmFjayBxdWUgbGkgaGVtIHBhc3NhdCBjb20gcGFyw6BtZXRyZVxuICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgbm9Mb2dpbihlcnJvciwgc3RhdHVzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBzcnYucmVnaXN0cmUgPSBmdW5jdGlvbih1c2VybmFtZSxwYXNzd29yZCwgbm9SZWdpc3Rlcil7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgIFBlciByZWdpc3RyYXIgdW4gdXN1YXJpIG5vdSwgbm9tw6lzIGhlbSBkZSBmZXIgdW4gcG9zdFxuICAgICAgICAgICAgICAgIGEgbCdhcGkgZCd1c3VhcmlzXG4gICAgICAgICAgICAqL1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlcnMnLCB7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZFxuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oZXJyb3Isc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgbm9SZWdpc3RlcihlcnJvcixzdGF0dXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubG9nT3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgIFF1YW4gbCd1c3VhcmkgZmEgbG9nb3V0IHMnZXNib3JyYSBlbCB0b2tlblxuICAgICAgICAgICAgICAgIGkgcG9zZW0gbGEgcHJvcGlldGF0IGRlbCBzZXJ2ZWkgXCJhdXRoXCIgYSBmYWxzZVxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNydi5hdXRoID0gZmFsc2U7XG4gICAgICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsneC1hdXRoJ10gPVwiXCI7XG4gICAgICAgIH07XG4gICAgfSk7IiwiYW5ndWxhci5tb2R1bGUoJ2JpYmxpb0FwcCcpXG4gICAgLmNvbnRyb2xsZXIoJ0VkaXRMbGlicmVzQ29udHJvbGxlcicsZnVuY3Rpb24oJHNjb3BlLCRsb2NhdGlvbixMbGlicmVzU2VydmVyKSB7XG4gICAgICAgICAkc2NvcGUuJHdhdGNoR3JvdXAoWydlZGl0VGl0b2wnLCdlZGl0SXNibnEnXSxmdW5jdGlvbihuZXdWYWwsIG9sZFZhbCkge1xuICAgICAgICAgICAgICAgIGlmIChuZXdWYWwhPW9sZFZhbCAmJiBuZXdWYWwhPW51bGwpXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5lcnJvcj1udWxsO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWlzc2F0Z2U9bnVsbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuICAgICAgICAkc2NvcGUubWlzc2F0Z2UgPSBudWxsO1xuICAgICAgICAkc2NvcGUuZWRpdElzYm4gPSBMbGlicmVzU2VydmVyLmVkaXQuaXNibjtcbiAgICAgICAgJHNjb3BlLmVkaXRUaXRvbCA9IExsaWJyZXNTZXJ2ZXIuZWRpdC50aXRvbDtcbiAgICAgICAgJHNjb3BlLiR3YXRjaEdyb3VwKFsnbm91VGl0b2wnLCdub3VJc2JuJ10sZnVuY3Rpb24obmV3VmFsLCBvbGRWYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsIT1vbGRWYWwgJiYgbmV3VmFsIT1udWxsKVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3I9bnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1pc3NhdGdlPW51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLmVkaXRhciA9IGZ1bmN0aW9uKHBhdGF0YSkge1xuICAgICAgICAgICAgaWYgKCRzY29wZS5lZGl0VGl0b2wgJiYgJHNjb3BlLmVkaXRJc2JuICl7XG4gICAgICAgICAgICAgICAgTGxpYnJlc1NlcnZlci5zcnYudXBkYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgbGxpYnJlRWRpdGFyOiBMbGlicmVzU2VydmVyLmVkaXQsICAvL2xsaWJyZSBvcmlnaW5hbFxuICAgICAgICAgICAgICAgICAgICBlZGl0YXI6IHsgLy9jYW52aXMgZmV0IGFsIGxsaWJyZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0b2w6JHNjb3BlLmVkaXRUaXRvbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzYm46ICRzY29wZS5lZGl0SXNiblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5taXNzYXRnZT0gXCJMbGlicmUgZWRpdGF0XCI7XG4gICAgICAgICAgICAgICAgfSxmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gZXJyLmRhdGEubWlzc2F0Z2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5jYW5jZWxhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy9sbGlzdGF0TGxpYnJlcycpO1xuICAgICAgICB9O1xuICAgIH0pOyIsImFuZ3VsYXIubW9kdWxlKCdiaWJsaW9BcHAnKVxuICAgIC5jb250cm9sbGVyKCdMbGlzdGF0TGxpYnJlc0NvbnRyb2xsZXInLGZ1bmN0aW9uKCRzY29wZSwkbG9jYXRpb24sTGxpYnJlc1NlcnZlcikge1xuICAgICAgICBMbGlicmVzU2VydmVyLnNydi5xdWVyeShmdW5jdGlvbihsbGlicmVzKXtcbiAgICAgICAgICAgICRzY29wZS5sbGlicmVzID0gbGxpYnJlcztcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAkc2NvcGUuZXNib3JyYXIgPSBmdW5jdGlvbihsbGlicmUpIHtcbiAgICAgICAgICAgIExsaWJyZXNTZXJ2ZXIuc3J2LmRlbGV0ZSh7aWQ6bGxpYnJlLmlzYm59LGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICAgIGlmIChyZXMuJHJlc29sdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5sbGlicmVzLnNwbGljZSgkc2NvcGUubGxpYnJlcy5pbmRleE9mKGxsaWJyZSksMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5lZGl0YXIgPSBmdW5jdGlvbihsbGlicmUpIHtcbiAgICAgICAgICAgIExsaWJyZXNTZXJ2ZXIuZWRpdCA9IGxsaWJyZTtcbiAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvZWRpdExsaWJyZScpO1xuICAgICAgICB9O1xuICAgIH0pOyIsImFuZ3VsYXIubW9kdWxlKCdiaWJsaW9BcHAnKVxuICAgIC5jb250cm9sbGVyKCdOb3VMbGlicmVDb250cm9sbGVyJyxmdW5jdGlvbigkc2NvcGUsJGxvY2F0aW9uLExsaWJyZXNTZXJ2ZXIpIHtcbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcbiAgICAgICAgJHNjb3BlLm1pc3NhdGdlID0gbnVsbDtcbiAgICAgICAgJHNjb3BlLiR3YXRjaEdyb3VwKFsnbm91VGl0b2wnLCdub3VJc2JuJ10sZnVuY3Rpb24obmV3VmFsLCBvbGRWYWwpIHtcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsIT1vbGRWYWwgJiYgbmV3VmFsIT1udWxsKVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3I9bnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1pc3NhdGdlPW51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLmd1YXJkYXIgPSBmdW5jdGlvbihwYXRhdGEpIHtcbiAgICAgICAgICAgIGlmICgkc2NvcGUubm91VGl0b2wgJiYgJHNjb3BlLm5vdUlzYm4gKXtcbiAgICAgICAgICAgICAgICBMbGlicmVzU2VydmVyLnNydi5zYXZlKHtcbiAgICAgICAgICAgICAgICAgICAgdGl0b2w6JHNjb3BlLm5vdVRpdG9sLFxuICAgICAgICAgICAgICAgICAgICBpc2JuOiAkc2NvcGUubm91SXNiblxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm91SXNibj1udWxsO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm91VGl0b2w9bnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1pc3NhdGdlPSBcIkxsaWJyZSBjcmVhdFwiO1xuICAgICAgICAgICAgICAgIH0sZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5lcnJvciA9IGVyci5kYXRhLm1pc3NhdGdlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUuY2FuY2VsYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkc2NvcGUubm91SXNibiA9IG51bGw7XG4gICAgICAgICAgJHNjb3BlLm5vdVRpdG9sID0gbnVsbDtcbiAgICAgICAgfTtcbiAgICB9KTsiLCJhbmd1bGFyLm1vZHVsZSgnYmlibGlvQXBwJylcbiAgICAuY29udHJvbGxlcihcIkxvZ2luQ29udHJvbGxlclwiLCBmdW5jdGlvbigkc2NvcGUsJGxvY2F0aW9uLFVzZXJTdmMpIHtcbiAgICAgICAgICRzY29wZS4kd2F0Y2hHcm91cChbJ3VzZXJuYW1lJywncGFzc3dvcmQnXSxmdW5jdGlvbihuZXdWYWwsIG9sZFZhbCkge1xuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICogVmlnaWxlbSBsZXMgdmFyaWFibGVzIGRlIGwnJHNjb3BlIFwidXNlcm5hbWVcIlxuICAgICAgICAgICAgICAgICAqIGkgXCJwYXNzd29yZFwiIHBlciBlc2JvcnJhciBlbCBtaXNzYXRnZSBkJ2Vycm9yXG4gICAgICAgICAgICAgICAgICogc2kgaGkgaGEuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbCE9b2xkVmFsKVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3I9bnVsbDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbih1c2VybmFtZSxwYXNzd29yZCkge1xuICAgICAgICAgICAgaWYgKCF1c2VybmFtZSB8fCAhcGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSBcIkhhcyBkJ2VtcGxlbmFyIHRvdHMgZWxzIGNhbXBzXCI7XG4gICAgICAgICAgICB9IGVsc2V7XG4gICAgICAgICAgICAgICAgVXNlclN2Yy5sb2dpbih1c2VybmFtZSxwYXNzd29yZCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyb3Isc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZ1bmNpw7MgcXVlIHMnZXhlY3V0YXLDoCBzaSBoaSBoYSB1biBlcnJvciBlbiBlbCBsb2dpblxuICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5lcnJvciA9IGVycm9yLm1pc3NhdGdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVXNlclN2Yy5nZXRVc2VyKCkudGhlbihmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaSB0b3QgdmEgYsOpLCBhbmVtIGEgbGEgcMOgZ2luYSBwcmluY2lwYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSBlbWV0ZW4gdW4gbWlzc2F0Z2UgZGUgXCJsb2dpblwiIHBlciBhdmlzYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSBsYSBub3N0cmEgYXBwIHF1ZSBsJ3VzdWFyaSBoYSBmZXQgbG9naW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29ycmVjdGFtZW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRlbWl0KCdsb2dpbicsIHVzZXIuZGF0YSk7ICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pOyIsImFuZ3VsYXIubW9kdWxlKCdiaWJsaW9BcHAnKVxuICAgIC5jb250cm9sbGVyKFwiUmVnaXN0ZXJDb250cm9sbGVyXCIsZnVuY3Rpb24oJHNjb3BlLCRsb2NhdGlvbixVc2VyU3ZjKSB7XG4gICAgICAgIFxuICAgICAgICAkc2NvcGUucmVnaXN0cmFyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoJHNjb3BlLnVzZXJuYW1lID09IG51bGwgfHwgJHNjb3BlLnBhc3N3b3JkID09IG51bGwgfHwgJHNjb3BlLnBhc3N3b3JkMiA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5lcnJvciA9IFwiSGFzIGQnZW1wbGVuYXIgdG90cyBlbHMgY2FtcHNcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoJHNjb3BlLnBhc3N3b3JkICE9ICRzY29wZS5wYXNzd29yZDIpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSBcIkxlcyBjb250cmFzZW55ZXMgbm8gY29pbmNpZGVpeGVuXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFVzZXJTdmMuc3J2LnJlZ2lzdHJlKCRzY29wZS51c2VybmFtZSwkc2NvcGUucGFzc3dvcmQsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVycm9yLHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGdW5jacOzIHF1ZSBzJ2V4ZWN1dGFyw6Agc2kgaGkgaGEgdW4gZXJyb3IgZW4gZWwgbG9naW5cbiAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09IDQwMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSBlcnJvci5taXNzYXRnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9