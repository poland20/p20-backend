'use strict';

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
  findOneDeep(params) {
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

    return Edition.findOne(params).populate(populate);
  },
  currentEdition() {
    return strapi.services.edition.findOneDeep({ current: true });
  },
  findOneByYear(params) {
    return strapi.services.edition.findOneDeep({ year: params.year });
  }
};
