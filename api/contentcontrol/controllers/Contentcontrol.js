'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
    settings: () => strapi.services.contentcontrol.settings()
};
