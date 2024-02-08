require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// URL Shortener Microservice
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));  
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: Number
});
const Url = mongoose.model('Url', urlSchema);
let urlCounter = 0;
app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;
  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }
  try {
    let urlDoc = await Url.findOne({ original_url: originalUrl });
    if (!urlDoc) {
      urlDoc = new Url({
        original_url: originalUrl,
        short_url: ++urlCounter
      });
      await urlDoc.save();
    }
    res.json({
      original_url: urlDoc.original_url,
      short_url: urlDoc.short_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json('Server Error');
  }
});
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;
  try {
    const urlDoc = await Url.findOne({ short_url: shortUrl });
    if (!urlDoc) {
      return res.status(404).json('No URL found');
    }
    res.redirect(urlDoc.original_url);
  } catch (err) {
    console.error(err);
    res.status(500).json('Server Error');
  }
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

