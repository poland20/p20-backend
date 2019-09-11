'use strict';

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
  checkCoupon: async ctx => {
    const { code } = ctx.request.body;
    if (!code) {
      return ctx.response.badRequest('Coupon code missing.');
    }

    const coupon = await Coupon.findOne({ code, active: true });
    if (!coupon) {
      strapi.log.error(`Coupon ${code} not found or not active.`);
      return ctx.response.notFound('Coupon not found or is not active.');
    }

    ctx.send({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      basketCondition: coupon.basketCondition
    });
  }
};
