'use strict';

const stripe = require('stripe');

module.exports = {
  createPaymentIntent: async ctx => {
    const Stripe = stripe(strapi.config.currentEnvironment.stripeApiKey);
    const { amount, basket, participants } = ctx.request.body;
    if (!amount || !basket || !participants) {
      ctx.response.badRequest();
      return;
    }

    const paymentIntent = await Stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'gbp'
    });

    // if (err) {
    //   ctx.response.badImplementation(`Could not create PaymentIntent: ${err}`);
    //   return;
    // }

    await strapi.services.order.create({
      basket,
      participants,
      paymentIntent: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: 'pending',
      date: Date.now()
    });

    ctx.send({ client_secret: paymentIntent.client_secret });
  }
};
