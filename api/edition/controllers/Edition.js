'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  currentEdition: () => strapi.services.edition.currentEdition(),
  findOneByYear: ctx => strapi.services.edition.findOneByYear(ctx.params),
};
