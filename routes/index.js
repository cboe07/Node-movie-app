var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config/config')

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
			titleHeader: `You search for ${termUserSearchedFor}`
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


module.exports = router;








