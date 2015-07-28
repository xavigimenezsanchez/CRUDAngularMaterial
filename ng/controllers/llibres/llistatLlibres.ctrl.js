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