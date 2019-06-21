'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
    currentEdition: ctx => strapi.services.edition.currentEdition(ctx.params),
    findOneByYear: ctx => strapi.services.edition.findOneByYear(ctx.params),
};
