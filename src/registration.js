import express from 'express';
import validator from 'express-validator';
import { db } from './db.js';

const { check, validationResult } = validator;

export const registration = express.Router();
const idPattern = '^[0-9]{6}-?[0-9]{4}$';

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function getPagingResults(list, limit, req) {
  const currentPage = req.params.page||1;
  const port = 3000;
 
  const result = {
    currentPage: currentPage,
    _links: {
      self: {
        href: `${currentPage}`,
      },
    },
    items: list,
  };

  if(currentPage > 1) {
    const prevPage = Number(currentPage) - 1;
    result._links.prev = {
      href: `${prevPage}`
    };
  }

  if (list.length >= limit) {
    const nextPage = Number(currentPage) + 1;
    result._links.next = {
      href: `${nextPage}`
    };
  }

  return result;
}

async function show(req, call) {
  let page = req.params.page;
  if(!page) page = 1

  const limit = 50;
  const offset = Number(page-1) * limit
  const list = await db.select(offset, limit);
  const count = await db.count();
  const result = getPagingResults(list, limit, req)

  const view = {
    limit: limit,
    page: page,
    offset: offset,
    list: list,
    count: count,
    result: result,
    call: call,
  };
  return view;
}

async function getRegistrations(req, res) {
  const view = await show( req, 'main' );
  
  return res.render('main', { view });
}

async function getAdminView(req,res) {
  const view = await show( req, 'admin' );
  return res.render('admin', { view });
}

async function showErrors(req, res, next) {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errorMessages = validation.array();
    const view = await show(req, 'error');
    return res.render('main', { view, errorMessages });
  }
  return next();
}

async function postRegistrations(req, res) {
  const {
    body: {
      name = '',
      kt = '',
      ath = '',
      hidden = false,
    } = {},
  } = req;

  const data = {
    name,
    kt,
    ath,
    hidden,
  };

  await db.insert(data);
  return res.redirect('/');
}

async function validKT(value) {
  const id = (await db.query('SELECT * FROM signatures WHERE nationalid = ($1)', [value])).rowCount;
  if (id > 0) {
    throw new Error('Kennitala þegar skráð');
  }
  return true;
}

// Öll validations
const validations = [
  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('kt')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),

  check('kt')
    .matches(idPattern)
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),

  check('kt')
    .blacklist('-').custom((val) => validKT(val))
    .withMessage('Kennitala þegar skráð'),
];

const sanitazions = [
  check('name').trim().escape(),
  check('kt').trim().blacklist('-').escape(),
  check('ath').trim().escape(),
];



registration.get('/admin', catchErrors(getAdminView))
registration.get('/:page', catchErrors(getRegistrations))
registration.get('/', catchErrors(getRegistrations));
registration.post('/', validations, showErrors, sanitazions, catchErrors(postRegistrations));
