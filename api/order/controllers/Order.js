'use strict';

const stripe = require('stripe');
const unparsed = require('koa-body/unparsed.js');

module.exports = {
  createPaymentIntent: async ctx => {
    const Stripe = stripe(strapi.config.currentEnvironment.stripeApiKey);
    const { basket, participants } = ctx.request.body;
    if (!basket || !participants) {
      return ctx.response.badRequest('Basket or participants are missing.');
    }

    let amount = 0;
    const ticketTypes = await Tickettype.find({ active: true });
    for (const { ticket } of participants) {
      const ticketType = ticketTypes.find(ticketType => ticketType.id === ticket);
      const quantity = basket[ticket];
      if (!ticketType || quantity < 1) {
        return ctx.response.badRequest('Basket contains an invalid item/amount.');
      }

      if (ticketType.quantity < quantity) {
        return ctx.response.resourceGone('One of the items in the basket is no longer available.');
      }

      amount += ticketType.price * 100;
    }

    if (amount < 1) {
      return ctx.response.badImplementation('There was a problem with calculating the payment amount.');
    }

    return Stripe.paymentIntents
      .create({
        amount,
        currency: 'gbp'
      })
      .then(async (paymentIntent) => {
        strapi.services.order.create({
          basket: JSON.stringify(participants, null, 2),
          participants: JSON.stringify(participants, null, 2),
          amount: amount / 100,
          paymentIntent: paymentIntent.id,
          status: 'pending',
          date: Date.now()
        });
    
        ctx.send({ client_secret: paymentIntent.client_secret });
      })
      .catch(() => ctx.response.badImplementation('Could not create a PaymentIntent.'));
  },
  confirmPaymentIntent: async ctx => {
    const Stripe = stripe(strapi.config.currentEnvironment.stripeApiKey);

    let event;
    try {
      event = Stripe.webhooks.constructEvent(
        ctx.request.body[unparsed],
        ctx.request.get('stripe-signature'),
        strapi.config.currentEnvironment.stripeWebhookSecret
      );
    } catch (err) {
      return ctx.response.badRequest(err);
    }

    if (!event || event.type !== 'payment_intent.succeeded') {
      return ctx.response.badRequest('Invalid Event type');
    }

    const paymentIntent = event.data.object;

    const order = await Order.findOne({ paymentIntent: paymentIntent.id });
    if (!order) {
      return ctx.response.badImplementation('Could not find an order for this payment intent.');
    }
    if (order.status !== 'pending') {
      return ctx.response.conflict('This order has already been processed.');
    }

    const participants = JSON.parse(order.participants);
    const basket = JSON.parse(order.basket);
    await Promise
      .all(participants.map(
        ({ ticket, name, email }) => strapi.services.ticket.create({
          name,
          email,
          type: ticket,
          order: order.id,
        })
      ))
      .then(() => Promise.all(Object.entries(basket).map(
        async ([id, quantity]) => {
          const ticketType = await Tickettype.findOne({ _id: id });
          const newQuantity = ticketType.quantity - quantity;
          return strapi.services.tickettype.update({ id }, {
            quantity: newQuantity >= 0 ? newQuantity : 0,
          });
        })
      ))
      .then(() => strapi.services.order.update({ _id: order.id }, {
        status: 'paid'
      }))
      .catch(err => ctx.response.badImplementation(`Could not generate tickets: ${err}`));
    
    ctx.send(200);
  }
};
