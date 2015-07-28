var Llibre = require("../../../models/llibre");
var router = require("express").Router();

router.get("/", function(req, res, next) {
    Llibre.find(function(err, llibres) {
        if (err) {
            return next(err);
        }
        res.json(llibres);
    });
});

router.get("/isbn/:id", function(req, res, next) {
    console.log(req.params.id);
    Llibre.find({"isbn": req.params.id}).find(function(err, llibre) {
        if (err) {
            return next(err);
        }
        res.json(llibre);
    });
});

router.delete("/:id", function(req, res, next) {
    if (req.auth){
        Llibre.remove({"isbn": req.params.id}, function(err) {
            if (err) {
                return next(err);
            }
            res.status(201).json({"missatge": "Llibre amb isbn " + req.params.id + " esborrat"});
        });
    } else {
        res.status(401).json({"missatge":"Operació no permesa"});
    }
});

router.put("/", function(req, res,next) {
    if (req.auth){
        if (req.body.editar.isbn == req.body.llibreEditar.isbn) {
            Llibre.findByIdAndUpdate(req.body.llibreEditar._id,req.body.editar,function(err, llibre) {
                    if(err) {
                        return next(err);
                    } else {
                        res.status(201).json({"missatge": "Llibre modificat"});
                    }
            });
            
        } else {
            Llibre.findOne({"isbn" : req.body.editar.isbn}, function(e,llibre) {
                if (llibre != null) {
                    res.status(400).json({"missatge":"isbn ja existeix"});
                } else {
                    Llibre.findByIdAndUpdate(req.body.llibreEditar._id,req.body.editar,function(err, llibre) {
                        if(err) {
                            return next(err);
                        }else {
                            res.status(201).json({"missatge": "Llibre modificat"});
                        }
                    });
                }
            });
        }
    } else {
        res.status(401).json({"missatge":"Operació no permesa"});
    }
});

router.post("/", function (req,res,next) {
    if(req.auth) {
        var llibre = new Llibre({
            isbn : req.body.isbn,
            titol: req.body.titol
        });
        Llibre.findOne({"isbn": req.body.isbn})
            .exec(function(a,l) {
                if (l){
                    res.status(400).json({"missatge":"isbn ja existeix"});
                }else {
                    llibre.save(function(err, llibre) {
                        if (err) { return next(err) }
                        res.status(201).json(llibre);
                    });
                }
        });
    } else {
        res.status(401).json({"missatge":"Operació no permesa"});
    }
    
});

module.exports = router;