var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config/config');
var bcrypt = require('bcrypt-nodejs');


var mysql = require('mysql');
var connection = mysql.createConnection({
	host: config.sql.host,
	user: config.sql.user,
	password: config.sql.password,
	database: config.sql.database
});

connection.connect();


const apiBaseUrl = 'http://api.themoviedb.org/3';
const nowPlayingUrl = apiBaseUrl + '/movie/now_playing?api_key='+config.apiKey;
const imageBaseUrl = 'http://image.tmdb.org/t/p/w300';





/* GET home page. */
router.get('/', function(req, res, next) {
	// const apiKey = 'fec8b5ab27b292a68294261bb21b04a5';
	request.get(nowPlayingUrl,(error, response, movieData)=>{
		var movieData = JSON.parse(movieData);
		// console.log("===============");
		// console.log(req.session);
		// console.log("===============");
		res.render('index', { 
			movieData: movieData.results,
			imageBaseUrl: imageBaseUrl,
			titleHeader: "DC Movie Database"
		});
	});



});

// router.get('/search', (req,res)=>{
// 	res.send("The get search page");
// });

router.post('/search', (req,res)=>{
	// req.body is availbale because of the body-parser module
	// req.body is where POSTED data will live
	// res.json(req.body);
	var termUserSearchedFor = req.body.searchString;
	var searchUrl = apiBaseUrl + '/search/movie?query='+termUserSearchedFor+'&api_key='+config.apiKey;
	request.get(searchUrl,(error, response, movieData)=>{
		// res.json(JSON.parse(movieData));
		var movieData = JSON.parse(movieData);
		res.render('index', {
			movieData: movieData.results,
			imageBaseUrl: imageBaseUrl,
			titleHeader: `You search for ${termUserSearchedFor}`,
			sessionInfo: req.session
		});
	});


	// res.send("The post search page");
});

router.get('/movie/:id',(req,res)=>{
	// The route has a :id in it. A : means WILDCARD
	// a wild card is ANYTHING in that slot
	// all wildcards in routes are avilable in req.params
	var thisMovieId = req.params.id;
	// Build the URL per the API docs
	var thisMovieUrl = `${apiBaseUrl}/movie/${thisMovieId}?api_key=${config.apiKey}`;
	var thisMovieUrl2 = `${apiBaseUrl}/movie/${thisMovieId}/credits?api_key=${config.apiKey}`;
	// Use the request module to make an HTTP request
	request.get(thisMovieUrl, (error, response, movieData)=>{
		request.get(thisMovieUrl2, (error, response, creditData)=>{
			// parse the response into JSON
			var newMovieData = JSON.parse(movieData);
			var newCreditData = JSON.parse(creditData);
			// res.json(movieData);
			// First arg: the view file
			// Second param: obj to send the view file
			res.render('single-movie',{
				movieData: newMovieData,
				imageBaseUrl: imageBaseUrl,
				creditData: newCreditData
			});

		});
		

	});
	// res.send(req.params.id);
});

router.get('/register', (req,res)=>{
	// res.send("This is the register page.")
	var message = req.query.msg;
	if(message == "badEmail"){
		message = "This email is already registered";
	}
	res.render('register', {message: message});
});

router.post('/registerProcess', (req,res)=>{
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	var hash = bcrypt.hashSync(password);
	console.log(hash);

	var selectQuery = "SELECT * FROM users WHERE email = ?";
	connection.query(selectQuery, [email],(error,results)=>{
		if(results.length == 0){
			// User is not in db. Insert them
			var insertQuery = "INSERT INTO users (name,email,password) VALUES (?,?,?)";
			connection.query(insertQuery, [name,email,hash], (error, results)=>{
				// Add session vars -- name, email, loggedin, id
				req.session.name = name;
				req.session.email = email;
				req.session.loggedin = true;
				res.redirect('/?msg=registered')
			});
		}else{
			// User is in db. Send them back to register witha message
			res.redirect('/register?msg=badEmail');
		}

	});

	// res.json(req.body);
});

router.get('/login', (req,res)=>{
	// res.send("This is the login page.")
	res.render('login',{ });
});

router.post('/processLogin', (req,res)=>{
	// res.json(req.body);
	var email = req.body.email;
	var password = req.body.password;
	// var selectQuery = "SELECT * FROM users WHERE email = ? AND password = ?";
	var selectQuery = "SELECT * FROM users WHERE email = ?";
	connection.query(selectQuery,[email], (error,results)=>{
		if(results.length == 1){
			// Match found!
			// Check to see if password matches

			var match = bcrypt.compareSync(password, results[0].password);
			if(match === true){
				// We passed the english password and hash through compareSync, and they did match
				req.session.loggedin = true;
				req.session.name = results[0].name;
				req.session.email = results[0].email;
				res.redirect('/?msg=loggedin');
			}else{
				res.redirect('/login?msg=badLogin');
			}


			
		}else{
			// This isnt the droid we're looking for
			res.redirect('/login?msg=badLogin');
		}
	});
});




module.exports = router;








