import dotenv from 'dotenv';

import path from 'path';
import express from 'express';

import { fileURLToPath } from 'url';

import { registration } from './registration.js';
import { admin } from './admin.js';
import { dayFormat, errors, totalPages } from './locals.js';

dotenv.config();

const app = express();

const {
  PORT: port = 3000,
} = process.env;

// TODO setja upp rest af virkni!
const fileneme = fileURLToPath(import.meta.url);
const dirname = path.dirname(fileneme);

app.use(express.static(path.join(dirname, './../public')));
app.use(express.urlencoded({ extended: true }));

app.locals.dayFormat = (str) => dayFormat(str);
app.locals.errors = (str, a) => errors(str, a);
app.locals.totalPages = (str) => totalPages(str);

app.set('views', path.join(dirname, './../views'));
app.set('view engine', 'ejs');

app.get('/admin', admin);
app.get('/admin/:page', admin);
app.use('/', registration);
app.use('/:page', registration);

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { title: 'Villa', error: 'Villa kom upp' });
}

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: 'Villa', error: 'Síða fannst ekki' });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
