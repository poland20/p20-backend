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

    return Edition.findOne(params).populate(populate);
  }
};
