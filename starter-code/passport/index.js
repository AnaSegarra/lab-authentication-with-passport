const passport = require('passport');
const User = require('../models/user');

require('./strategies/local');

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => {
	console.log('deserializing user');
	User.findById(id)
		.then(user => {
			done(null, user);
		})
		.catch(error => done(error));
});

module.exports = app => {
	app.use(passport.initialize());
	app.use(passport.session());
};
