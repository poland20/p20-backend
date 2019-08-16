'use strict';

const Email = require('email-templates');
const path = require('path');

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
  sendConfirmation: async ticket => {
    const email = new Email({
      juiceResources: {
        webResources: {
          relativeTo: path.resolve('emails')
        }
      }
    });
    const currentEdition = await strapi.services.edition.currentEdition();
    const html = await email.render('confirmation', {
      name: ticket.name,
      ticket: ticket,
      order: ticket.order,
      edition: {
        startDate: currentEdition.endDate.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      venue: currentEdition.venue
    });
    return strapi.plugins['email'].services.email
      .send({
        html,
        to: ticket.email,
        subject: `Your Conference Ticket [${ticket.code}]`,
      });
  }
};
