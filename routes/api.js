'use strict';

const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  comments: { type: [String], default: [] }
});

const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);

module.exports = function (app) {

  // POST /api/books
  app.post('/api/books', async (req, res) => {
    try {
      const title = req.body.title;
      if (!title) return res.type('text').send('missing required field title');

      const book = await Book.create({ title, comments: [] });
      return res.json({ _id: book._id.toString(), title: book.title });
    } catch (e) {
      return res.status(500).type('text').send('server error');
    }
  });

  // GET /api/books
  app.get('/api/books', async (req, res) => {
    try {
      const books = await Book.find({}).lean();
      return res.json(books.map(b => ({
        _id: b._id.toString(),
        title: b.title,
        commentcount: (b.comments || []).length
      })));
    } catch (e) {
      return res.status(500).type('text').send('server error');
    }
  });

  // GET /api/books/:id
  app.get('/api/books/:id', async (req, res) => {
    try {
      const book = await Book.findById(req.params.id).lean();
      if (!book) return res.type('text').send('no book exists');

      return res.json({
        _id: book._id.toString(),
        title: book.title,
        comments: book.comments || []
      });
    } catch (e) {
      return res.type('text').send('no book exists');
    }
  });

  // POST /api/books/:id  (add comment)
  app.post('/api/books/:id', async (req, res) => {
    try {
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
    } catch (e) {
      return res.type('text').send('no book exists');
    }
  });

  // DELETE /api/books/:id
  app.delete('/api/books/:id', async (req, res) => {
    try {
      const deleted = await Book.findByIdAndDelete(req.params.id);
      if (!deleted) return res.type('text').send('no book exists');
      return res.type('text').send('delete successful');
    } catch (e) {
      return res.type('text').send('no book exists');
    }
  });

  // DELETE /api/books
  app.delete('/api/books', async (req, res) => {
     try {
      await Book.deleteMany({});
      return res.type('text').send('complete delete successful');
    } catch (e) {
      return res.status(500).type('text').send('server error');
    }
  });

};