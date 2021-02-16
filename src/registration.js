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

async function getRegistrations(req, res) {
  const list = await db.select();
  return res.render('main', { list });
}

async function showErrors(req, res, next) {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errorMessages = validation.array();
    const list = await db.select();
    return res.render('main', { list, errorMessages });
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
  const list = await db.select();
  return res.render('main', { list });
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

registration.get('/', catchErrors(getRegistrations));
registration.post('/', validations, showErrors, sanitazions, catchErrors(postRegistrations));
