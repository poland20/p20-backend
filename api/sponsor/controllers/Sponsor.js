'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
    previousSponsors: ctx => Sponsor.find({ showInPrevious: true }).populate()
};
