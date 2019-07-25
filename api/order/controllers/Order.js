'use strict';

const stripe = require('stripe');

module.exports = {
  paymentIntent: async ctx => {
    const Stripe = stripe(strapi.config.currentEnvironment.stripeApiKey);
    const { amount } = ctx.request.body;
    const paymentIntent = await Stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'gbp'
    });
    ctx.send({ clientSecret: paymentIntent.client_secret });
  }
};
