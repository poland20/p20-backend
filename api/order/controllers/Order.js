'use strict';

const stripe = require('stripe');
const unparsed = require('koa-body/unparsed.js');
const shortid = require('shortid');

module.exports = {
  createPaymentIntent: async ctx => {
    const Stripe = stripe(strapi.config.currentEnvironment.stripeApiKey);
    const { basket, participants } = ctx.request.body;
    if (!basket || !participants) {
      return ctx.response.badRequest('Basket or participants are missing.');
    }

    let amount = 0;
    let description = [];
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
      description.push(`${ticketType.name} (x${quantity})`);
    }

    if (amount < 1) {
      return ctx.response.badImplementation('There was a problem with calculating the payment amount.');
    }

    const orderCode = shortid.generate();

    return Stripe.paymentIntents
      .create({
        amount,
        description: description.join(description.length < 2 ? '' : ', '),
        currency: 'gbp',
        metadata: {
          orderCode
        }
      })
      .then(async (paymentIntent) => {
        strapi.services.order.create({
          basket,
          participants,
          amount: amount / 100,
          paymentIntent: paymentIntent.id,
          status: 'pending',
          date: Date.now(),
          code: orderCode
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
    if (paymentIntent.livemode && order.status !== 'pending') {
      return ctx.send('This order has already been processed.');
    }

    await Promise
      .all(order.participants.map(
        ({ ticket, name, email }) => strapi.services.ticket
          .create({
            name,
            email,
            type: ticket,
            order: order.id,
            date: Date.now(),
            code: shortid.generate(),
            checkedIn: false
          })
          .then(strapi.services.ticket.sendConfirmation)
          // .then(() => console.log('Email sent'))
          // .catch(console.error)
          .catch(err => ctx.response.badImplementation(`Could not generate tickets: ${err}`))
      ))
      .then(() => Promise.all(Object.entries(order.basket).map(
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
      .catch(err => ctx.response.badImplementation(`Could not finalise order: ${err}`));

    ctx.send(200);
  }
};
