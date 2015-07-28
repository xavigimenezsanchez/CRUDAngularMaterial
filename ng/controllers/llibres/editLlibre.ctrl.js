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