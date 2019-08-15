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
        startDate: currentEdition.startDate.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        startTime: currentEdition.startDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
      },
      venue: currentEdition.venue
    });
    return strapi.plugins['email'].services.email
      .send({
        html,
        to: ticket.email,
        subject: 'Your Conference Ticket',
      });
  }
};
