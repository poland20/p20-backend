'use strict';
const { Expo } = require('expo-server-sdk');

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  register: async ctx => {
    const { token } = ctx.request.body;
    if (!token || !token.value) {
      return ctx.response.badRequest('Push token is missing.');
    }

    if (!Expo.isExpoPushToken(token.value)) {
      return ctx.response.badRequest('Push token is invalid.');
    }

    const pushDevice = await Pushdevice.findOne({ token: token.value });
    if (pushDevice) {
      strapi.log.debug(`Push device ${token.value} already exists`);
      return ctx.response.conflict('This device is already registered.');
    }

    return strapi.services.pushdevice
      .create({
        token: token.value,
      })
      .then(() => {
        strapi.log.info(`Registered push device ${token.value}`);
        return ctx.send(200);
      })
      .catch(error => {
        strapi.log.error(`Could not register push device ${token.value}\n${error}`);
        return ctx.response.badImplementation('Could not register push device.');
      });
  }
};
