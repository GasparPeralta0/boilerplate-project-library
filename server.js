'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();
// Force HTTPS behind proxy (Render/Cloudflare)
app.set('trust proxy', 1);
app.use((req, res, next) => {
  const proto = req.headers['x-forwarded-proto'];
  if (proto && proto !== 'https') {
    return res.redirect(301, 'https://' + req.headers.host + req.originalUrl);
  }
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', allowedHeaders: ['Content-Type'] }));
app.options('*', cors()); // preflight

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

fccTestingRoutes(app);
apiRoutes(app);

app.use(function(req, res) {
  res.status(404).type('text').send('Not Found');
});

async function start() {
  try {
    await mongoose.connect(process.env.DB, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ MongoDB connected');

    const listener = app.listen(process.env.PORT || 3000, function () {
      console.log('Your app is listening on port ' + listener.address().port);

      if (process.env.NODE_ENV === 'test') {
        console.log('Running Tests...');
        setTimeout(function () {
          try {
            runner.run();
          } catch (e) {
            console.log('Tests are not valid:');
            console.error(e);
          }
        }, 1500);
      }
    });
  } catch (err) {
    console.log('MongoDB connection error:', err);
  }
}

start();

module.exports = app;