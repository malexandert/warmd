var rendering = require('../../config/rendering');


exports.home = function(req, res) {
    res.render('index/index');
}


exports.userHome = function(req, res) {
    res.render('index/user-home');
}
