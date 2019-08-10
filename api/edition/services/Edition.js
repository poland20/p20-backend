'use strict';

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
  findOne(params) {
    let populate = Edition.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    populate = populate.concat([
      {
        path: 'agendaDays',
        populate: [
          {
            path: 'venue'
          },
          {
            path: 'events',
            populate: [
              {
                path: 'speakers'
              },
              {
                path: 'category'
              }]
          }]
      }
    ]);

    const edition = Edition.findOne(params).populate(populate);

    return edition;
  },
  currentEdition(params) {
    return strapi.services.edition.findOne({ current: true });
  },
  findOneByYear(params) {
    return strapi.services.edition.findOne({ year: params.year });
  }
};
