require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { checkHash } = require('./lib/hashing');
const User = require('./models/user');

mongoose
	.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
	.then(x => {
		console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
	})
	.catch(err => {
		console.error('Error connecting to mongo', err);
	});

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
	session({
		secret: 'passport-auth',
		resave: true,
		saveUninitialized: false,
		store: new MongoStore({
			mongooseConnection: mongoose.connection
		})
	})
);
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((id, done) => {
	console.log('deserializing user');
	User.findById(id)
		.then(user => {
			done(null, user);
		})
		.catch(error => done(error));
});
passport.use(
	new LocalStrategy(async (username, password, done) => {
		const registeredUser = await User.findOne({ username });
		if (!registeredUser || !checkHash(password, registeredUser.password)) {
			console.log('invalid credentials');
			return done(null, false);
		} else {
			console.log(`${registeredUser} just logged in`);
			return done(null, registeredUser);
		}
	})
);
app.use(passport.initialize());
app.use(passport.session());

// Setup user for every view
app.use((req, res, next) => {
	console.log(req.session);
	res.locals.user = req.user;
	next();
});

// Express View engine setup
app.use(
	require('node-sass-middleware')({
		src: path.join(__dirname, 'public'),
		dest: path.join(__dirname, 'public'),
		sourceMap: true,
		outputStyle: 'compressed'
	})
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(`${__dirname}/views/partials`);
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';

// Routes middleware goes here
const index = require('./routes/index');
app.use('/', index);

module.exports = app;
