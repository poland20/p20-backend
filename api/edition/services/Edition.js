'use strict';

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
    currentEdition: () => {
        const populate = Edition.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias)
            .join(' ');

        return Edition.findOne().populate(populate);
    }
};
