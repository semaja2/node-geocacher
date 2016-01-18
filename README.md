# node-geocacher

Provides a wrapper to node-geocode allowing for self rate limiting and caching of results.

Whilst using node-geocode on a server enviroment you may run into the rate limits imposed by Google etc (10 requests per second)

node-geocacher provides both geocode and batchGeocode just like node-geocode, but will review its cache, check if the cache entry exists or has expired, then perform a lookup that is queued by function-rate-limit module

## Cache storage

Cache storage is provided by a Mongoose model, this allows for central storage among nodes as well as fast searching of the cache

Each cached geocode will store the address, coordinates (latitutude/longitude) and an expiry date

The expiry period is defined when adding the module

## Usage
  
    // Define the provider, refer to node-geocode for more info
    var geocoderProvider = 'google' 
    
    // Define the http adapter, refer to node-geocode for more info
    var httpAdapter = 'http'
    
    // Define the provider, refer to node-geocode for more info
    var extra = { region: 'Australia' } 
    
    // How long cache entry will sustain
    var cacheExpiry = 86400000; 
    
    // How long is the interval
    var rateLimitInterval = 1000; 
    
    // How many times a request can be made during the interval
    var rateLimitPerInterval = 5; 
    
    // Database location
    var geocacher_db = 'mongodb://localhost/geocache'
    
    // Define geocode and geocacher modules, passing various configuration data
    var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra)
    var geocacher = require('geocacher')(geocoder, geocacher_db, cacheExpiry, rateLimitInterval, rateLimitPerInterval);
    
    
    // Exectute batchGeocode
    geocacher.batchGeocode(['address1', 'address2'], function(err, results) {
      if (err) console.log(err)
      console.log(results)
    });
