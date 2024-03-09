// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from the "public" directory
app.use('/public', express.static(`${process.cwd()}/public`));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Define the root route to serve the HTML file
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Map to store the original and short URLs
const urlMap = {};

// Handle POST requests to create short URLs
app.post('/api/shorturl', function(req, res) {
  var originalUrl = req.body.url;

  // Validate the URL asynchronously
  validateUrl(originalUrl, function(isValidUrl) {
    if (!isValidUrl) {
      // If the URL is invalid, send JSON response with error message
      res.json({ error: "invalid url" });
    } else {
      // Generate a random short URL
      var shortUrl = generateId(1, 4);

      // Ensure the generated short URL doesn't already exist
      while (urlMap.hasOwnProperty(shortUrl)) {
        shortUrl = generateId(1, 4);
      }
    
      // Store the original URL with the generated short URL
      urlMap[shortUrl] = originalUrl;

      // Send JSON response with the original and short URL
      res.json({ original_url: originalUrl, short_url: shortUrl });
    }
  });
});

// Handle GET requests to redirect short URLs
app.get('/api/shorturl/:shortUrl', function(req, res) {
  var shortUrl = req.params.shortUrl;
  var originalUrl = urlMap[shortUrl];

  if (originalUrl) {
    // If the short URL is found, redirect to the original URL
    res.redirect(originalUrl);
  }  else {
    // If the short URL is not found, send JSON response with error message
    res.status(404).json({ error: "Short URL not found" });
  }
});

// Function to validate the URL using DNS lookup
function validateUrl(url, callback) {
  const { hostname } = new URL(url);

  // Perform DNS lookup for the hostname
  dns.lookup(hostname, (err, address) => {
    if (err) {
      // If DNS lookup fails, invoke the callback with false
      console.error('DNS lookup error:', err);
      callback(false);
    } else {
      // If DNS lookup succeeds, invoke the callback with true
      callback(true);
    }
  });
}

// Function to generate a random short URL
function generateId(minDigits, maxDigits) {
  const numDigits = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;
  let randomId = '';

  for (let i = 0; i < numDigits; i++) {
    randomId += Math.floor(Math.random() * 10);
  }

  return randomId;
}

// Start the server and listen on the specified port
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
