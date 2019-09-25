'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  find: ctx => {
    const query = ctx.query || {};
    query.active = true;
    query.hidden_ne = true;

    return strapi.services.tickettype.find(query);
  }
};
