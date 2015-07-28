var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(require('./auth.js'));
//app.use(require("./auth"));
app.use("/api/llibres", require("./controllers/api/llibres/llibres"));
app.use("/api/sessions", require("./controllers/api/auth/sessions"));
app.use("/api/users", require("./controllers/api/auth/users"));

app.use("/",require("./controllers/static"));


app.listen(process.env.PORT, function() {
    console.log('Server listening on ', process.env.PORT);
});