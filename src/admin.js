import express from 'express';
import { db } from './db.js';


export const admin = express.Router();


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
 
  const result = {
    currentPage: currentPage,
    _links: {
      self: {
        href: `admin/${currentPage}`,
      },
    },
    items: list,
  };

  if(currentPage > 1) {
    const prevPage = Number(currentPage) - 1;
    result._links.prev = {
      href: `admin/${prevPage}`
    };
  }

  if (list.length >= limit) {
    const nextPage = Number(currentPage) + 1;
    result._links.next = {
      href: `admin/${nextPage}`
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



async function getAdminView(req,res) {
  const view = await show( req, 'admin' );
  return res.render('admin', { view });
}




admin.get('/admin', catchErrors(getAdminView))
admin.get('/admin/:page', catchErrors(getAdminView))
