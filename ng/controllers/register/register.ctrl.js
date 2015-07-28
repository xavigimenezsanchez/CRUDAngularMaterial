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