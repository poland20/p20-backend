'use strict';

const Email = require('email-templates');
const path = require('path');
const nodemailer = require('nodemailer');

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

    const currentEdition = await strapi.controllers.edition.current();
    if (!ticket.order.code) {
      ticket.order = await Order.findById(ticket.order);
    }
    if (!ticket.type.name) {
      ticket.type = await Tickettype.findById(ticket.type);
    }

    const html = await email.render('confirmation', {
      name: ticket.name,
      ticket: ticket,
      order: ticket.order,
      edition: {
        startDate: currentEdition.endDate.toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      },
      venue: currentEdition.venue
    });

    const transporter = nodemailer.createTransport({
      service: 'Zoho',
      host: 'smtp.zoho.com',
      port: 587,
      secure: false,
      auth: {
        user: strapi.config.nodemailerUser,
        pass: strapi.config.nodemailerPassword
      }
    });

    return new Promise((resolve) => {
      transporter.verify((error) => {
        if (error) {
          strapi.log.error(`Failed to connect to SMTP server:\n${error}`);
          resolve();
        } else {
          transporter
            .sendMail({
              html,
              from: 'Poland 2.0 Summit <no-reply@poland20.com>',
              to: ticket.email,
              replyTo: 'contact@poland20.com',
              subject: `Your Conference Ticket [${ticket.code}]`
            })
            .then(() => {
              strapi.log.info(`Sent ticket confirmation ${ticket.code} to ${ticket.email}`);
            })
            .catch(err => {
              strapi.log.error(`Failed to send ticket confirmation ${ticket.code} to ${ticket.email}:\n${err}`);
            })
            .finally(resolve);
        }
      });
    });
  }
};
