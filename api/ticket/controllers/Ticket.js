'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  verify: async ctx => {
    const { code, email } = ctx.request.body;
    if (!code || !email) {
      return ctx.response.badRequest('Ticket code or e-mail address missing.');
    }

    const ticket = await strapi.services.ticket.findOne({ code, email });
    if (!ticket) {
      const error = `Ticket code ${code} and e-mail address ${email} do not match any ticket`;
      strapi.log.error(error);
      return ctx.response.notFound('Ticket code and e-mail address do not match any ticket.');
    }

    return ctx.send(200);
  },
  checkIn: async ctx => {
    const { token } = ctx.request.header;
    if (token !== process.env.JWT_SECRET) {
      return ctx.response.forbidden();
    }

    const { code, ballAccess } = ctx.request.body;
    if (!code) {
      return ctx.response.badRequest('Ticket code is missing.');
    }

    const ticket = await strapi.services.ticket.findOne({ code });
    if (!ticket) {
      const error = `Ticket code ${code} is not valid`;
      strapi.log.error(error);
      return ctx.response.notFound('Invalid ticket code.');
    }

    const type = await Tickettype.findById(ticket.type);
    if (ballAccess === true && !type.ballAccess) {
      const error = `Ticket ${code} does not have ball access`;
      strapi.log.error(error);
      return ctx.response.notAcceptable('Ticket does not have ball access.');
    }

    const { id, checkedIn, checkedInDate } = ticket;

    if (!ballAccess && checkedIn) {
      const warning = `Ticket ${code} is already checked in`;
      strapi.log.warn(warning);
      return ctx.send({
        status: 'warning',
        message: 'Ticket is already checked in.',
        checkedInDate: checkedInDate,
      });
    }

    const date = new Date();
    return strapi.services.ticket
      .update({ id }, {
        checkedIn: true,
        checkedInDate: date
      })
      .then(() => {
        strapi.log.info(`Checked-in ticket ${code}`);
        ctx.send({
          status: 'success',
          checkedInDate: date,
        });
      })
      .catch(err => {
        const message = `Could not check-in ticket ${code}`;
        strapi.log.error(`${message}:\n${err}`);
        ctx.response.badImplementation(message);
      });
  }
};
