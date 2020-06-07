const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { checkHash } = require('../../lib/hashing');
const User = require('../../models/user');

passport.use(
	new LocalStrategy({ passReqToCallback: true }, async (req, username, password, done) => {
		try {
			const registeredUser = await User.findOne({ username });
			if (!registeredUser || !checkHash(password, registeredUser.password)) {
				console.log('Invalid credentials');
				req.flash('error', 'Invalid credentials');
				return done(null, false);
			} else {
				console.log(`${registeredUser} just logged in`);
				return done(null, registeredUser);
			}
		} catch (error) {
			return done(error);
		}
	})
);
