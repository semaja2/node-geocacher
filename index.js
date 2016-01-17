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

    // Other stuff...
    module.geocodeAddress = function(address, callback) {
      console.log("Geocode request for " + address)
      Geocache.findOne({address: address}, function(err, cacheEntry) {
        if (err) {
          console.error('Error searching cache');
          console.error(err);
        }
        if (cacheEntry && cacheEntry.coords) {
          console.log('Checking if cache has expired')
          if (cacheEntry.expires < Date.now()) { // Check if entry has expired
            console.log('Cache has expired')
            cacheEntry.remove() // Remove expired cache entry
            lookupAddress(address, function(err, result) {
              callback(err, result)
            })

          } else { // Entry still valid!
            console.log('Cache is still valid')
            callback(null, cacheEntry.coords)
          }
        } else {
          console.log('No cache for address found, starting geocode')
          lookupAddress(address, function(err, result) {
            callback(err, result)
          })
        }
      });
    };

    module.geocodeAddresses = function(addresses, callback) {
      var results = addresses.map(function(address) {
        return this.geocodeAddress(address);
      }, this);
      console.log(promises)
    }

    // Define the rate limited function
    var lookupAddress = rateLimit(rateLimitPerInterval, rateLimitInterval, geocodeAddressAndSave) // Ratelimit the caching to prevent the 10 requests per second

    function geocodeAddressAndSave(address, callback) {
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
