require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const shortId = require('shortid');
const validUrl = require('valid-url');
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
// Connect to database
const uri = process.env.MONGO_URI;
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000})
// Catch failed connection
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});
// URL model
const Schema = mongoose.Schema;
const URLSchema = new Schema({
  original_url: String,
  short_url: String
});
const URL = mongoose.model('URL', URLSchema);
// API routes
app.post('/api/shorturl', async function (req,res) {
  const url = req.body.url;
  const urlCode = shortId.generate();
  // Check if the url is valid or not
  if (!validUrl.isWebUri(url)) {
    res.json({
      error: 'Invalid URL'
    })
  } else {
    try {
      // check if its already in the database
      let findOne = await URL.findOne({
        original_url: url
      })
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        // if its not exist yet then create new one and response with the result
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        });
        await findOne.save();
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        });
      }
    } catch(err) {
      console.error(err);
      res.status(500).json('Server error...');
    }
  }
})
app.get('/api/shorturl/:short_url?', async function (req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    });
    if (urlParams) {
      return res.redirect(urlParams.original_url);
    } else {
      return res.status(404).json('No URL found');
    }
  } catch(err) {
    console.log(err);
    res.status(500).json('Server error');
  }
})
// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
