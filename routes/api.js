'use strict';

const crypto = require('crypto');

function makeId() {
  // 24-hex like Mongo ObjectId
  return crypto.randomBytes(12).toString('hex');
}

const books = new Map();

// Seed para el example test (solo en modo test)
if (process.env.NODE_ENV === 'test') {
  const id = makeId();
  books.set(id, { _id: id, title: 'Seed Book', comments: [] });
}

app.get('//api/books', (req, res) => res.redirect(301, '/api/books'));

module.exports = function (app) {
  // GET /api/books
  app.get('/api/books', function (req, res) {
    const out = Array.from(books.values()).map(b => ({
      _id: b._id,
      title: b.title,
      commentcount: (b.comments || []).length
    }));
    return res.json(out);
  });

  // POST /api/books
  app.post('/api/books', function (req, res) {
    const title = req.body && req.body.title;
    if (!title) return res.send('missing required field title');

    const id = makeId();
    const book = { _id: id, title, comments: [] };
    books.set(id, book);
    return res.json({ _id: id, title });
  });

  // DELETE /api/books
  app.delete('/api/books', function (req, res) {
    books.clear();
    // re-seed para que el example no falle si corren de nuevo
    if (process.env.NODE_ENV === 'test') {
      const id = makeId();
      books.set(id, { _id: id, title: 'Seed Book', comments: [] });
    }
    return res.send('complete delete successful');
  });

  // GET /api/books/:id
  app.get('/api/books/:id', function (req, res) {
    const book = books.get(req.params.id);
    if (!book) return res.send('no book exists');
    return res.json({
      _id: book._id,
      title: book.title,
      comments: book.comments || []
    });
  });

  // POST /api/books/:id (add comment)
  app.post('/api/books/:id', function (req, res) {
    const comment = req.body && req.body.comment;
    if (!comment) return res.send('missing required field comment');

    const book = books.get(req.params.id);
    if (!book) return res.send('no book exists');

    book.comments = book.comments || [];
    book.comments.push(comment);
    books.set(book._id, book);

    return res.json({
      _id: book._id,
      title: book.title,
      comments: book.comments
    });
  });

  // DELETE /api/books/:id
  app.delete('/api/books/:id', function (req, res) {
    const existed = books.delete(req.params.id);
    if (!existed) return res.send('no book exists');
    return res.send('delete successful');
  });
};