const dotenv = require('dotenv');
dotenv.config({ path: '../sample.env' });
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;

// Allows to get remotely tested
app.use(cors());

// Allows to retrieve style.css file
app.use('/public', express.static(`${process.cwd()}/public`));

// Allowws to retrieve the html file
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// It parses de body outputting a key value pair. extended true allows nested objects
app.use(bodyParser.urlencoded({ extended: true }));  

// It connects the DB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Create DB schema
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: Number
});

// Create DB model
let Url = mongoose.model('Url', urlSchema);

// Post request and clicking the link will retrieve the url and the short url as an object
let urlCounter = 1000; // Initiates the urlCounter
app.post('/api/shorturl', async (req, res) => {
  let originalUrl = req.body.url;
  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  } else {
      try {
        let urlDoc = await Url.findOne({ original_url: originalUrl });
        if (urlDoc) {
          res.json({
            original_url: urlDoc.original_url,
            short_url: urlDoc.short_url
          });
        } else {
          urlDoc = new Url({
            original_url: originalUrl,
            short_url: ++urlCounter
          });
          res.json({original_url: urlDoc.original_url, short_url: urlDoc.short_url});
          urlDoc.save();
        };
      } catch (err) {
        console.error(err);
        res.status(500).json('Server Error');
      };
    };
});

// Get request routing the short url should get us to the url web site
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;
  try {
    let urlDoc = await Url.findOne({ short_url: shortUrl });
    if (!urlDoc) {
      return res.status(404).json('No URL found');
    } else {
        res.redirect(urlDoc.original_url);
    };
  } catch (err) {
    console.error(err);
    res.status(500).json('Server Error');
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

