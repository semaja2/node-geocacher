var rateLimit = require('function-rate-limit');
var mongoose = require('mongoose');


module.exports = function (geocoder, db, cacheExpiry, rateLimitInterval, rateLimitPerInterval) {
  var module = {};

  // Connect to geocache database
  mongoose.connect(db);

  // Define out geocacheSchema
  var geocacheSchema = mongoose.Schema({
    address: String,
    coords: {
      latitude: Number,
      longitude: Number
    },
    expires: Number
  });

  // Define our Model
  var Geocache = mongoose.model('geocache', geocacheSchema);

  // Define our functions
  module.geocode = function(address, callback) {
    Geocache.findOne({address: address}, function(err, cacheEntry) {
      if (err) {
        callback(err, null);
      }
      if (cacheEntry && cacheEntry.coords) {
        // Checking if cache has expired
        if (cacheEntry.expires < Date.now()) { // Check if entry has expired
          // Cache has expired
          cacheEntry.remove() // Remove expired cache entry
          geocodeAndSaveRateLimited(address, function(err, result) {
            callback(err, result)
          })

        } else { // Entry still valid!
          console.log('Cache is still valid')
          callback(null, cacheEntry.coords)
        }
      } else {
        // No cache for address found, starting geocode
        geocodeAndSaveRateLimited(address, function(err, result) {
          callback(err, result)
        })
      }
    });
  };

  module.geocodeBatch = function(addresses, callback) {
    console.log('Not yet implemented')
  }

  // Define the rate limited function
  var geocodeAndSaveRateLimited = rateLimit(rateLimitPerInterval, rateLimitInterval, geocodeAndSave) // Ratelimit the caching to prevent the 10 requests per second

  function geocodeAndSave(address, callback) {
    geocoder.geocode(address, function(err, result) {
      console.log('Geocoding for ' + address)
      if (err) {
        callback(err, null)
      } else {
        var cacheEntry = new Geocache({
          address: address,
          coords: {
            latitude: result[0].latitude,
            longitude: result[0].longitude
          },
          expires: Date.now() + cacheExpiry
        })
        cacheEntry.save(function (err, cacheEntry) {
          if (err) console.error(err);
          callback(null, cacheEntry.coords)
        });
      }
    });
  }

  return module;
};
