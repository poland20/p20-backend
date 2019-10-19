'use strict';

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
  find(params, populate) {
    populate = [
      {
        path: 'venue'
      },
      {
        path: 'agendaDays',
        populate: [
          {
            path: 'events',
            populate: [
              {
                path: 'speakers'
              }
            ]
          }
        ]
      }
    ];

    return strapi.query('edition').find(params, populate);
  },
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
