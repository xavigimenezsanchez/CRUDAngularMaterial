angular.module('biblioApp')
.factory("LlibresServer", function($resource) {
    this.srv = $resource("/api/llibres/:id", null,
    {
        'update': { method:'PUT' }
    });
    
    this.edit = null;
    return this;
});