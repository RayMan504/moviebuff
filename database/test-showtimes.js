const { Showtimes, Theatres, Show } = require('./index.js');

function testDb(showtime, showing) {
  Show.findOrCreate({
    where: { name: showtime.title },
    defaults: {
      name: showtime.title,
    },
  });
  console.log(Show, 'shoooow');
  Theatres.findOrCreate({
    where: { name: showing.theatre.name },
    defaults: {
      name: showing.theatre.name,
    },
  });
  return Showtimes.findOrCreate({
    where: { time: showing.dateTime },
    defaults: {
      time: showing.dateTime,
    },
    includes: [{
      model: Show, as: 'ShowRef',
    }, {
      model: Theatres, as: 'TheatreRef',
    }],
  });
  console.log('hey');
}

module.exports.testDb = testDb;
