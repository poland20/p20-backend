'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
    currentEdition: params => strapi.services.edition.currentEdition(params)
};
