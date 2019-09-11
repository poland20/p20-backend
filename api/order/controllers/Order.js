'use strict';

const stripe = require('stripe');
const unparsed = require('koa-body/unparsed.js');
const shortid = require('shortid');

module.exports = {
  createPaymentIntent: async ctx => {
    const Stripe = stripe(strapi.config.currentEnvironment.stripeApiKey);
    const { basket, participants, coupon } = ctx.request.body;
    if (!basket || !participants) {
      return ctx.response.badRequest('Basket or participants are missing.');
    }

    let amount = 0;
    let description = new Set();
    const ticketTypes = await Tickettype.find({ active: true });
    for (const { ticket } of participants) {
      const ticketType = ticketTypes.find(ticketType => ticketType.id === ticket);
      const quantity = basket[ticket];
      if (!ticketType || quantity < 1) {
        const error = 'Basket contains an invalid item/amount.';
        strapi.log.error(error);
        return ctx.response.badRequest(error);
      }

      if (ticketType.quantity < quantity) {
        const error = 'One of the items in the basket is no longer available.';
        strapi.log.error(error);
        return ctx.response.resourceGone(error);
      }

      amount += ticketType.price * 100;
      description.add(`${ticketType.name} (x${quantity})`);
    }

    let couponType;
    if (coupon) {
      couponType = await Coupon.findOne({ code: coupon, active: true });
      if (!couponType) {
        const error = `Coupon code ${coupon} is not valid.`;
        strapi.log.error(error);
        return ctx.response.badRequest(error);
      }

      if (couponType.type === 'discountFixed') {
        amount = Math.max(amount - (couponType.value * 100), 100);
      } else if (couponType.type === 'discountPercentage') {
        amount = Math.ceil(amount * (1 - couponType.value / 100));
        amount = Math.max(amount, 100);
      }
    }

    if (amount < 100) {
      const error = 'There was a problem with calculating the payment amount.';
      strapi.log.error(error);
      return ctx.response.badImplementation(error);
    }

    const orderCode = shortid.generate();

    return Stripe.paymentIntents
      .create({
        amount,
        description: [...description].join(', '),
        currency: 'gbp',
        metadata: {
          orderCode,
          coupon
        }
      })
      .then((paymentIntent) => {
        strapi.services.order.create({
          basket,
          participants,
          coupon: couponType,
          amount: amount / 100,
          paymentIntent: paymentIntent.id,
          status: 'pending',
          date: Date.now(),
          code: orderCode
        });

        strapi.log.info(`Successfully created order ${orderCode}`);
        ctx.send({ client_secret: paymentIntent.client_secret });
      })
      .catch(error => {
        const message = 'Could not create a PaymentIntent.';
        strapi.log.error(`${message}\n${error}`);
        ctx.response.badImplementation(message);
      })
      .then(() => Promise.all(
        participants.map(({
          type, programmingLanguages, university, course, yearOfStudy, industry
        }) => {
          if (type || university || course || yearOfStudy.length > 0 || industry || programmingLanguages) {
            strapi.services.survey.create({
              type, university, course, yearOfStudy, industry,
              date: new Date(),
              programmingLanguages: programmingLanguages.join(';')
            });
          }
        })
      ));
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
      strapi.log.error(`Failed to verify webhook signature\n${err}`);
      return ctx.response.badRequest(err);
    }

    if (!event || event.type !== 'payment_intent.succeeded') {
      const error = 'Invalid Event';
      strapi.log.error(error);
      return ctx.response.badRequest(error);
    }

    const paymentIntent = event.data.object;

    const order = await Order.findOne({ paymentIntent: paymentIntent.id });
    if (!order) {
      const error = `Could not find an order for payment intent ${paymentIntent.id}`;
      strapi.log.error(error);
      return ctx.response.badImplementation(error);
    }
    if (paymentIntent.livemode && order.status !== 'pending') {
      const warning = `Order ${order.code} has already been processed`;
      strapi.log.warn(warning);
      return ctx.send(warning);
    }

    return Promise
      .all(order.participants.map(
        ({ ticket, name, email, linkedin }) => strapi.services.ticket
          .create({
            name,
            email,
            linkedin,
            type: ticket,
            order: order.id,
            date: Date.now(),
            code: shortid.generate(),
            checkedIn: false
          })
          .then(strapi.services.ticket.sendConfirmation)
      ))
      .then(() => strapi.services.order.update({ _id: order.id }, {
        status: 'paid'
      }))
      .then(() => Promise.all(Object.entries(order.basket).map(
        async ([id, quantity]) => {
          const ticketType = await Tickettype.findById(id);
          const newQuantity = ticketType.quantity - quantity;
          return strapi.services.tickettype.update({ id }, {
            quantity: newQuantity >= 0 ? newQuantity : 0,
          });
        })
      ))
      .then(() => {
        strapi.log.info(`Successfully processed order ${order.code}`);
        ctx.send(200);
      })
      .catch(err => {
        const message = `Could not finalise order ${order.code}`;
        strapi.log.error(`${message}:\n${err}`);
        ctx.response.badImplementation(message);
      });
  }
};
