'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' })); // FCC testing only

// ✅ Use Express built-in parsers (more reliable than body-parser in some setups)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Index page
app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// FCC testing routes
fccTestingRoutes(app);

// API routes
apiRoutes(app);

// Invalid JSON handler (must be AFTER parsers and routes is okay; it catches parser errors too)
app.use(function (err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).type('text').send('invalid json');
  }
  return next(err);
});

// 404
app.use(function (req, res) {
  res.status(404).type('text').send('Not Found');
});

// ✅ Connect ONCE
mongoose
  .connect(process.env.DB, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('✅ MongoDB connected');

    if (process.env.NODE_ENV === 'test') {
      console.log('Running Tests...');

      // ✅ Seed book for example test if empty
      const Book = mongoose.models.Book;
      if (Book) {
        const count = await Book.countDocuments({});
        if (count === 0) {
          await Book.create({ title: 'Seed Book', comments: [] });
        }
      }

      setTimeout(function () {
        try {
          runner.run();
        } catch (e) {
          console.log('Tests are not valid:');
          console.error(e);
        }
      }, 1500);

      // ✅ IMPORTANT: do NOT app.listen() in test mode
      return;
    }

    // Normal mode: start server
    const listener = app.listen(process.env.PORT || 3000, function () {
      console.log('Your app is listening on port ' + listener.address().port);
    });
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err);
  });

// ✅ IMPORTANT: export app synchronously for chai.request(server)
module.exports = app;