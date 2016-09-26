/**
 * Cash Receipt Controller
 *
 * This controller is responsible to assembling the cash payment receipt and
 * rendering it for the client.
 *
 * @module finance/reports/cash.receipt
 */
'use strict';

const _    = require('lodash');
const q    = require('q');

const BadRequest = require('../../../lib/errors/BadRequest');
const ReportManager = require('../../../lib/ReportManager');

const CashPayments = require('../cash');
const Users = require('../../admin/users');
const Patients = require('../../medical/patients');
const Enterprises = require('../../admin/enterprises');
const Exchange = require('../../finance/exchange');

const TEMPLATE = './server/controllers/finance/reports/cash.receipt.handlebars';

/**
 * @method build
 *
 * @description
 * This method builds the cash payment receipt as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/cash/:uuid
 */
function build(req, res, next) {
  const options = req.query;

  let report;

  // set up the report with report manager
  try {
    report = new ReportManager(TEMPLATE, req.session, options);
  } catch (e) {
    return next(e);
  }

  const data = {};

  CashPayments.lookup(req.params.uuid)
    .then(payment => {
      data.payment = payment;

      return q.all([
        Users.lookup(payment.user_id),
        Patients.lookupByDebtorUuid(payment.debtor_uuid),
        Enterprises.lookupByProjectId(payment.project_id),
      ]);
    })
    .spread((user, patient, enterprise) => {
      _.assign(data, { user, patient, enterprise });
      return Exchange.getExchangeRate(enterprise.id, data.payment.currency_id, data.payment.date);
    })
    .then(exchange => {
      data.rate = exchange.rate;
      data.hasRate = (data.rate && !data.payment.is_caution);

      return report.render(data);
    })
    .then(result => {
      res.set(result.headers).send(result.report);
    })
    .catch(next)
    .done();
}

module.exports = build;