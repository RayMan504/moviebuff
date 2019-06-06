const axios = require('axios');
const { API_KEY, youtube_api_key } = require('../../config')
const { User, Movie, UsersMovies, Showtimes, Theatres, TVShows, Show } = require('../../database');
const Sequelize = require('sequelize');

const Op = Sequelize.Op; // needed for special Sequelize queries

// Database Helpers

// Creation Functions




//store showtimes
// const storeShowtimes = (title, date, zipCode) => {
//   let url = `http://data.tmsapi.com/v1.1/movies/showings?startDate=${date}&zip=${zipCode}&api_key=${process.env.SHOWTIME_API}`
//   //axios get to tmsapi. use date, zip code, and api key in url params
//   axios.get(url)
//     .then((response) => {
//       console.log(response);
//       //iterate response data
//       response.data.forEach((showtime) => {
//         // CHECK FOR MATCHING MOVIE TITLE
//         if (showtime.title === title) {
//           // iterate over showtimes
//           showtime.showtimes.forEach((showing) => {
//             // save showtimes, movie name, and runtime to database
//             // store dateTimes in array
//             // const times = [];
//             // times.push(show.dateTime);
//             Show.findOrCreate({
//               where: { name: showtime.title },
//               defaults: {
//                 name: showtime.title,
//               },
//             });
//             console.log(Show, 'shoooow');
//             Theatres.findOrCreate({
//               where: { name: showing.theatre.name },
//               defaults: {
//                 name: showing.theatre.name,
//               },
//             });
//             Showtimes.findOrCreate({
//               where: { time: showing.dateTime },
//               defaults: {
//                 time: showing.dateTime,
//               },
//               includes: [{
//                 model: Show, as: 'ShowRef',
//               }, {
//                 model: Theatres, as: 'TheatreRef',
//               }],
//             });
//             console.log('hey');
//           });
//         }
//       });
//     });
//   // get showtimes
//   return Showtimes.findAll({ where: { title } }).then((output) => {
//     return output;
//   });
// };

const getShowtimes = (title, date, zipCode) => {
  const url = `http://data.tmsapi.com/v1.1/movies/showings?startDate=${date}&zip=${zipCode}&api_key=${process.env.SHOWTIME_API}`;
  return axios.get(url).then((showtimes) => {
    let output;
    showtimes.data.forEach((showtime) => {
      if (showtime.title === title) {
        output = showtime;
      }
    });
    return output;
  });
};

const storeUser = (username, email) => User.findOrCreate({ // create user with params to match schema
  where: { email }, // keeps entries unique to email
  defaults: { username, email } // stores params with corresponding keys
}); 

const storeMovie = (title, movieDescription, posterPath, voteCount, voteAverage) =>
  Movie.findOrCreate({ // creates database entry with params as keys to match schema
    where: { title }, // keeps entries unique to the title
    defaults: { // stores params with corresponding keys
      title,
      movieDescription,
      posterPath,
      voteCount,
      voteAverage,
    }
});

const storeUsersMovies = (uDbId, movDbId) => // takes in user and movie id's from database
  UsersMovies.findOrCreate({ // creates a join table with unique values for movieId and userId
    where: { userId: uDbId, movieId: movDbId }, 
    defaults: { userId: uDbId, movieId: movDbId }
  })

// Create helper function for storing tvShows
const storeTVshow = (title, showDescription, posterPath, voteCount, voteAverage) => TVShows.findOrCreate({
  where: { title },
  defaults: {
    title,
    showDescription,
    posterPath,
    voteCount,
    voteAverage,
  }
});

const storeUsersShows = (uDbId, showDbId) => 
  UsersMovies.findOrCreate({
    where: { userId: uDbId, showId: showDbId },
    defaults: { userId: uDbId, showId: showDbId }
  })

// Retrieval functions

const findUsersMovies = uDbId => // param passed in is the user id from database
  UsersMovies.findAll({ // find all movieId's stored on join table tied to given user id
    attributes: ['movieId'],
    where: { userId: uDbId} 
  });


const findUserVotes = movDbId => // param passed in is the movie id from database 
  Movie.findAll({ // find current userVotes value for a given movie by its id that is stored on the database
    attributes: ['userVotes'],
    where: {
      id: movDbId,
    },
  });

const findAllMovies = movDbIdArr => // pass in array of movie id's grabbed from join table in database
  Movie.findAll({ // find all movies that match the given id's in the movieDbArr
    where: {
      id: {
        [Op.or]: movDbIdArr 
      }
    }
  });

const findUserId = email => 
  User.findOne({ where: { email } }) 
    .then(user => user.id); // sends back id of the user that matches username on User table

const findMovieId = title =>
  Movie.findOne({ where: { title } })
    .then(movie => movie.id); // sends back id of the movie that matches title on Movie table

// Create helper function to grab all tvShows from db
const findShowId = title =>
  TVShows.findOne({ where: { title } })
    .then(show => show.id);
// search for given id

// Update functions

const changeVotes = (movDbId, numFlag) =>  // change userVotes in database -- Expects numFlag to be 1 or -1 -- Handles string edge case for numFlag value
  Movie.increment('userVotes', { by: Number(numFlag), where: { id: movDbId } }) // increments the userVotes of the movie matching the movie id
    .then(movie => movie[0][0][0].id); // No idea why the model object is this deeply nested but it is. Leave this alone. It works

// API Helpers

const nowPlaying = () => // grabs movies that are currently playing
  axios.get('https://api.themoviedb.org/3/movie/now_playing', {
    params: {
      api_key: API_KEY,
      language: 'en-US',
      page: 1,
      region: 'US',
    }
  })
  .then(response => response)
  .catch(err => console.error(err))

const tvAiring = () => 
  axios.get('https://api.themoviedb.org/3/tv/popular', {
    params: {
      api_key: API_KEY,
      language: 'en-US',
      page: 1,
      region: 'US',
    }
  })
  .then(response => response)
  .catch(err => console.log(err))



const getMovie = movieName => // grabs searched movies
  axios.get('https://api.themoviedb.org/3/search/movie', {
    params: {
      api_key: API_KEY,
      query: `${movieName}`,
    }
  })
  .then(response => response.data.results)
  .catch(err => console.error(err))

const getShow = showName =>
  axios.get('https://api.themoviedb.org/3/search/tv', {
    params: {
      api_key: API_KEY,
      query: `${showName}`,
    }
  })
  .then(response => response.data.results)
  .catch(err => console.log(err))

const getPopular = () => // grabs popular movies
  axios.get('https://api.themoviedb.org/3/movie/popular', {
    params: {
      api_key: API_KEY,
      language: 'en-US',
      page: 1,
      region: 'US'
    }
  })
  .then(response => response.data.results)

const getReviews = movieId => // param passed in is the movie id from api call
  axios.get(`https://api.themoviedb.org/3/movie/${movieId}/reviews`, { // grabs movie reviews
    params: {
      api_key: API_KEY,
      language: 'en-US',
      page: 1,
    }
  })
  .then(response => response.data.results)


const getTrailer = (movieName) => {
  return axios.get(`https://www.googleapis.com/youtube/v3/search`, {
    params: {
      key: youtube_api_key,
      q: `${movieName} trailer`,
      maxResults: 1,
      part: 'snippet',
      type: 'video',
      videoEmbeddable: true,
    }
  }).then((videoData) => {
    console.log(videoData.data.items);
    return videoData.data.items;
  }).catch((err) => {
    console.error(err);
  })
}

// Create helper function for grabbing tvShows from api
// create axios get request to url
// give api key

module.exports = {
  getMovie,
  getPopular,
  getReviews,
  nowPlaying,
  storeMovie,
  storeUser,
  findUserVotes,
  changeVotes,
  findUserId,
  findMovieId,
  storeUsersMovies,
  findUsersMovies,
  findAllMovies,
  getTrailer,
  storeTVshow,
  findShowId,
  storeUsersShows,
  tvAiring,
  getShow,
  getShowtimes,
};
