var db = require("../db");
var Llibre = db.model('Llibre', {
            isbn: {
                type: String,
                required: true,
                unique: true
            },
            titol: {
                type: String,
                required: true
            },
            resum: {
                type: String
            },
            autors : {
                type: [String]
            },

            date: {
                type: Date,
                required: true,
                default: Date.now
            }
    });

module.exports = Llibre;