'use strict';
const shortid = require('shortid');

/**
 * Lifecycle callbacks for the `Ticket` model.
 */

module.exports = {
  // Before saving a value.
  // Fired before an `insert` or `update` query.
  // beforeSave: async (model) => {},

  // After saving a value.
  // Fired after an `insert` or `update` query.
  // afterSave: async (model, result) => {},

  // Before fetching all values.
  // Fired before a `fetchAll` operation.
  // beforeFetchAll: async (model) => {},

  // After fetching all values.
  // Fired after a `fetchAll` operation.
  // afterFetchAll: async (model, results) => {},

  // Fired before a `fetch` operation.
  // beforeFetch: async (model) => {},

  // After fetching a value.
  // Fired after a `fetch` operation.
  // afterFetch: async (model, result) => {},

  // Before creating a value.
  // Fired before an `insert` query.
  beforeCreate: async (model) => {
    if (!model.code) {
      model.code = shortid.generate();
    }
    if (!model.date) {
      model.date = new Date();
    }
    if (typeof model.checkedIn === 'undefined') {
      model.checkedIn = false;
    }
    if (typeof model.checkedInBall === 'undefined') {
      model.checkedInBall = false;
    }
  },

  // After creating a value.
  // Fired after an `insert` query.
  afterCreate: async (model, result) => {
    if (result.email
      && !result.checkedIn
      && !result.checkedInBall
      && !result.checkedInDate
    ) {
      setTimeout(async () => {
        const ticket = await Ticket.findById(result._id);
        if (ticket && !ticket.order) {
          strapi.services.ticket.sendConfirmation(ticket);
        }
      }, 1000);
    }
  },

  // Before updating a value.
  // Fired before an `update` query.
  // beforeUpdate: async (model) => {},

  // After updating a value.
  // Fired after an `update` query.
  afterUpdate: async (model) => {
    const update = model.getUpdate()['$set'];
    if (update
      && update.email
      && !update.checkedIn
      && !update.checkedInBall
      && !update.checkedInDate
    ) {
      setTimeout(async () => {
        const ticket = await Ticket.findById(update._id);
        if (ticket) {
          strapi.services.ticket.sendConfirmation(ticket);
        }
      }, 1000);
    }
  },

  // Before destroying a value.
  // Fired before a `delete` query.
  // beforeDestroy: async (model) => {},

  // After destroying a value.
  // Fired after a `delete` query.
  // afterDestroy: async (model, result) => {}
};
