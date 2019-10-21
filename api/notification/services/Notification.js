'use strict';
const { Expo } = require('expo-server-sdk');

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
  send: async ({ id, title, description, priority }) => {
    const expo = new Expo();
    const devices = await Pushdevice.find();
    const messages = devices.map(device => ({
      title,
      priority: priority || 'default',
      body: description,
      to: device.token,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    (async () => {
      for (const chunk of chunks) {
        try {
          const ticketChunks = await expo.sendPushNotificationsAsync(chunk);
          for (const ticketChunk of ticketChunks) {
            if (ticketChunk.status === 'error') {
              strapi.log.error(`Could not push notification: ${ticketChunk.message}`);
            }
          }

          strapi.log.info(`Sent notification "${title}"`);
          strapi.services.notification.update({ id }, {
            status: 'sent'
          });
        } catch (error) {
          strapi.services.notification.update({ id }, {
            status: 'failed'
          });
          strapi.log.error(`Notification error for "${title}"\n${error}`);
        }
      }
    })();
  }
};
