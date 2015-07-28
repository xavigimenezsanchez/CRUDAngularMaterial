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