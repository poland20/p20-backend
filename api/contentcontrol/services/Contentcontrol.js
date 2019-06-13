'use strict';

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
    settings: () => {
        const populate = Contentcontrol.associations
            .filter(ast => ast.autoPopulate !== false)
            .map(ast => ast.alias)
            .join(' ');

        return Contentcontrol.findOne().populate(populate);
    }
};
