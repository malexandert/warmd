'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User');

module.exports = {
  // Create a new User
  create: function(req, res) {
    var newUser = new User(req.body);
    newUser.save()
      .then(function(user) {
        res.status(201).json(user.toJSON());
      })
      .catch(function(err) {
        res.status(400).json(err);
      });
  },

  // Load a User from the database
  load: function(req, res, next, username) {
    User.findOne({username: username})
      .then(function(user) {
        if (!user) {
          res.status(401).json({
            QueryError: 'User with username ' + username + ' not found'
          });
        }
        // Can't do req.user, interferes with Passport
        req.userData = user;
        next();
      })
      .catch(function(err) {
        next(err);
      });
  },

  // Display a User that was loaded
  show: function(req, res) {
    res.json(req.userData.toJSON());
  },

  // Update a User
  update: function(req, res) {
    // A User should only be able to change their own password
    if (req.body.password && (req.userData.username !== req.user.username)) {
      res.status(401).json({
        QueryError: 'Cannot change passwords for other users'
      });
    }

    User.findOneAndUpdate({username: req.userData.username}, req.body, {new: true})
      .then(function(updatedUser) {
        res.json(updatedUser.toJSON());
      })
      .catch(function(err) {
        res.status(400).json(err);
      });
  },

  // Delete a User
  delete: function(req, res) {
    User.findOneAndRemove({username: req.userData.username})
      .then(function(removedUser) {
        res.json({removedUser: removedUser.username});
      })
      .catch(function(err) {
        res.status(500).json(err);
      });
  },

  // Check if a User exists
  exists: function(req, res) {
    if (!req.body.username && !req.body.email) {
      res.status(400).json({
        QueryError: 'GET /exists must contain either a username, an email, or both'
      });
    }

    User.findOne(req.body)
      .then(function(result) {
        res.json({exists: (result !== null)});
      })
      .catch(function(err) {
        res.status(400).json(err);
      });
  },

  // Check if someone is currently logged in
  isAuthed: function(req, res, next) {
    process.nextTick(function() {
      if (req.isAuthenticated()) {
        return next();
      }
      res.status(401).json({
        AuthenticationError: 'You don\'t have permission to view this resource'
      });
    });
  },

  // Check if a User has access to a resource
  hasAccess: function(level) {
    var levels = ['None', 'User', 'Exec', 'Admin'];
    return function(req, res, next) {
      var minimumAuth = levels.indexOf(level);
      // Is the logged in user at *least* the provided level of auth?
      if (req.user && levels.indexOf(req.user.auth_level) >= minimumAuth) {
        next();
      } else {
        res.status(401).json({
          AuthenticationError: 'You don\'t have permission to use this resource'
        });
      }
    };
  },

  // Finds all pending Users in the database
  pending: function(req, res) {
    User.find({auth_level: 'None'})
      .then(function(pendingUsers) {
        res.json(pendingUsers);
      })
      .catch(function(err) {
        res.status(500).json(err);
      });
  }
};
