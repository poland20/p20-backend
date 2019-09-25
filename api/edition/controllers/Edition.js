'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  findOneByYear: ({ params }) => strapi.services.edition.findOne({ year: params.year }),
  current: () => strapi.services.edition.findOne({ current: true })
};
