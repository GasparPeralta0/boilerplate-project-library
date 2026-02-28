'use strict';

const mongoose = require('mongoose');

let isConnected = false;

// Schema + Model (definido acá para que exista siempre)
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  comments: { type: [String], default: [] }
});

const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);

async function ensureConnected() {
  if (isConnected) return;
  await mongoose.connect(process.env.DB, { serverSelectionTimeoutMS: 10000 });
  isConnected = true;
  console.log('✅ MongoDB connected (routes/api.js)');
}

module.exports = function (app) {

  // GET /api/books
  app.get('/api/books', async (req, res) => {
    try {
      await ensureConnected();
      const books = await Book.find({}).lean();
      return res.json(books.map(b => ({
        _id: b._id.toString(),
        title: b.title,
        commentcount: (b.comments || []).length
      })));
    } catch (err) {
      return res.status(500).type('json').send({ error: 'db error' });
    }
  });

  // POST /api/books
  app.post('/api/books', async (req, res) => {
    try {
      await ensureConnected();
      const title = req.body.title;
      if (!title) return res.type('text').send('missing required field title');

      const book = await Book.create({ title, comments: [] });
      return res.json({ _id: book._id.toString(), title: book.title });
    } catch (err) {
      return res.status(500).type('json').send({ error: 'db error' });
    }
  });

  // GET /api/books/:id
  app.get('/api/books/:id', async (req, res) => {
    try {
      await ensureConnected();
      const book = await Book.findById(req.params.id).lean();
      if (!book) return res.type('text').send('no book exists');

      return res.json({
        _id: book._id.toString(),
        title: book.title,
        comments: book.comments || []
      });
    } catch (err) {
      return res.type('text').send('no book exists');
    }
  });

  // POST /api/books/:id (add comment)
  app.post('/api/books/:id', async (req, res) => {
    try {
      await ensureConnected();
      const comment = req.body.comment;
      if (!comment) return res.type('text').send('missing required field comment');

      const book = await Book.findById(req.params.id);
      if (!book) return res.type('text').send('no book exists');

      book.comments.push(comment);
      await book.save();

      return res.json({
        _id: book._id.toString(),
        title: book.title,
        comments: book.comments
      });
    } catch (err) {
      return res.type('text').send('no book exists');
    }
  });

  // DELETE /api/books/:id
  app.delete('/api/books/:id', async (req, res) => {
    try {
      await ensureConnected();
      const deleted = await Book.findByIdAndDelete(req.params.id);
      if (!deleted) return res.type('text').send('no book exists');
      return res.type('text').send('delete successful');
    } catch (err) {
      return res.type('text').send('no book exists');
    }
  });

  // DELETE /api/books (delete all)
  app.delete('/api/books', async (req, res) => {
    try {
      await ensureConnected();
      await Book.deleteMany({});
      return res.type('text').send('complete delete successful');
    } catch (err) {
      return res.status(500).type('json').send({ error: 'db error' });
    }
  });

};