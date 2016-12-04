var rateLimit = require('function-rate-limit');
var mongoose = require('mongoose');


module.exports = function (geocoder, db, cacheExpiry, rateLimitInterval, rateLimitPerInterval) {
  var module = {};

  // Connect to geocache database
  mongoose.createConnection(db);

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
  geocode = function(address, callback) {
    if (callback === undefined) {
      return new Promise(function(resolve,reject){
        this.geocode(address,function(err,data){
          if(err !== null) return reject(err);
          resolve(data);
        });
      })
    }

    Geocache.findOne({address: address}, function(err, cacheEntry) {
      if (err) {
        callback(err, null);
      }
      if (cacheEntry && cacheEntry.coords) {
        if (cacheEntry.expires < Date.now()) { // Check if entry has expired
          cacheEntry.remove() // Remove expired cache entry
          geocodeAndSaveRateLimited(address, function(err, result) {
            callback(err, result)
          })

        } else { // Entry still valid!
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

  batchGeocode = function(values, callback) {
    if (callback === undefined) {
      return new Promise(function(resolve,reject){
        this.batchGeocode(values,function(err,data){
          if(err !== null) return reject(err);
          resolve(data);
        });
      })
    }

    var promises = values.map(function(value) {
      return this.geocode(value);
    }, this);

    Promise.all(promises)
    .then(function(results) {
      callback(null, results);
    })
    .catch(function(err) {
      callback(err, null);
    });
  }


  // Define the rate limited function
  var geocodeAndSaveRateLimited = rateLimit(rateLimitPerInterval, rateLimitInterval, geocodeAndSave) // Ratelimit the caching to prevent the 10 requests per second
  function geocodeAndSave(address, callback) {
    geocoder.geocode(address, function(err, result) {
      if (err) {
        callback(err, null)
      } else {
        if (result[0]) {
          var cacheEntry = new Geocache({
            address: address,
            coords: {
              latitude: result[0].latitude,
              longitude: result[0].longitude
            },
            expires: Date.now() + cacheExpiry
          })
        } else {
          var cacheEntry = new Geocache({
            address: address,
            coords: {},
            expires: Date.now() + cacheExpiry
          })
        }
        cacheEntry.save(function (err, cacheEntry) {
          if (err) console.error(err);
          callback(null, cacheEntry.coords)
        });
      }
    });
  }

  module.batchGeocode = batchGeocode
  module.geocode = geocode
  return module;
};
