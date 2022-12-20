/* eslint-disable no-console */
const express = require("express");

const app = express();
const { resolve } = require("path");
// Replace if using a different env file or config
require("dotenv").config({ path: "./.env" });
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const allitems = {};
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const MIN_ITEMS_FOR_DISCOUNT = 2;
app.use(express.static(process.env.STATIC_DIR));

app.use(
  express.json({
    // Should use middleware or a function to compute it only when
    // hitting the Stripe webhook endpoint.
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);
app.use(cors({ origin: true }));

// load config file
const fs = require("fs");

const configFile = fs.readFileSync("../config.json");
const config = JSON.parse(configFile);

// load items file for video courses
const file = require("../items.json");

file.forEach((item) => {
  const initializedItem = item;
  initializedItem.selected = false;
  allitems[item.itemId] = initializedItem;
});

// const asyncMiddleware = fn => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

// Routes
app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.get("/", (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/index.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

app.get("/concert", (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/concert.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

app.get("/setup-concert-page", (req, res) => {
  res.send({
    basePrice: config.checkout_base_price,
    currency: config.checkout_currency,
  });
});

// Show success page, after user buy concert tickets
app.get("/concert-success", (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/concert-success.html`);
    console.log(path);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

app.get("/videos", (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/videos.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

app.get("/setup-video-page", (req, res) => {
  res.send({
    discountFactor: config.video_discount_factor,
    minItemsForDiscount: config.video_min_items_for_discount,
    items: allitems,
  });
});

// Milestone 1: Signing up
// Shows the lesson sign up page.
app.get("/lessons", (req, res) => {
  try {
    const path = resolve(`${process.env.STATIC_DIR}/lessons.html`);
    if (!fs.existsSync(path)) throw Error();
    res.sendFile(path);
  } catch (error) {
    const path = resolve("./public/static-file-error.html");
    res.sendFile(path);
  }
});

app.post("/lessons", async (req, res) => {
  try {
    const data = req.body;
    const { name, email, token, first_lesson } = data;

    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0 && customers.data[0].default_source) {
      return res.status(403).json({
        message: "Email already exist",
        customer_id: customers.data[0].id,
      });
    }

    const customer = await stripe.customers.create({
      name: name,
      email: email,
      metadata: { first_lesson: first_lesson },
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
        },
      },
    });

    const source = await stripe.customers.createSource(customer.id, {
      source: token,
    });
    console.log(
      "source",
      source,
      "customer",
      customer,
      "setupintent",
      setupIntent
    );
    res.send({
      clientSecret: setupIntent.client_secret,
      customer_id: setupIntent.customer,
      last4: source.last4,
    });
  } catch (e) {
    console.log("lessons route", e);
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

// app.get("/get-card-number/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const response = await stripe.paymentMethods.retrieve(id);
//     res
//       .status(200)
//       .json({ last4: response.card.last4, customerId: response.customer });
//   } catch (error) {
//     return res.status(400).send({
//       error: {
//         message: e.message,
//       },
//     });
//   }
// });

// Milestone 2: '/schedule-lesson'
// Authorize a payment for a lesson
//
// Parameters:
// customer_id: id of the customer
// amount: amount of the lesson in cents
// description: a description of this lesson
//
// Example call:
// curl -X POST http://localhost:4242/schdeule-lesson \
//  -d customer_id=cus_GlY8vzEaWTFmps \
//  -d amount=4500 \
//  -d description='Lesson on Feb 25th'
//
// Returns: a JSON response of one of the following forms:
// For a successful payment, return the Payment Intent:
//   {
//        payment: <payment_intent>
//    }
//
// For errors:
//  {
//    error:
//       code: the code returned from the Stripe error if there was one
//       message: the message returned from the Stripe error. if no payment method was
//         found for that customer return an msg 'no payment methods found for <customer_id>'
//    payment_intent_id: if a payment intent was created but not successfully authorized
// }

app.post("/schedule-lesson", async (req, res) => {
  try {
    const data = req.body;
    const { customer_id, amount, description } = data;
    if (!customer_id || amount < 1 || !description) {
      return res.status(400).send({
        error: {
          message: "Invalid parameters",
        },
      });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customer_id,
      amount: amount,
      currency: "usd",
      capture_method: "manual",
      confirm: true,
      description: description,
      metadata: { type: "lessons-payments" },
    });
    res.status(200).send({
      payment: paymentIntent,
    });
  } catch (error) {
    console.log("schedule lesson", error);
    res.status(400).send({
      error: {
        code: error.code,
        message: error.raw?.message,
        payment_intent_id: error.payment_intent?.id,
      },
    });
  }
});

// Milestone 2: '/complete-lesson-payment'
// Capture a payment for a lesson.
//
// Parameters:
// amount: (optional) amount to capture if different than the original amount authorized
//
// Example call:
// curl -X POST http://localhost:4242/complete_lesson_payment \
//  -d payment_intent_id=pi_XXX \
//  -d amount=4500
//
// Returns: a JSON response of one of the following forms:
//
// For a successful payment, return the payment intent:
//   {
//        payment: <payment_intent>
//    }
//
// for errors:
//  {
//    error:
//       code: the code returned from the error
//       message: the message returned from the error from Stripe
// }
//
app.post("/complete-lesson-payment", async (req, res) => {
  const data = req.body;
  const { payment_intent_id, amount } = data;
  try {
    const paymentIntent = await stripe.paymentIntents.capture(
      payment_intent_id,
      { amount }
    );
    // const paymentIntent = await stripe.paymentIntents.confirm(
    //   payment_intent_id,
    //   { payment_method: "pm_card_visa" }
    // );
    res.status(200).send({ payment: paymentIntent });
  } catch (error) {
    console.log("complete lesson", error);
    res.status(400).send({
      error: {
        code: error.code,
        message: error.raw?.message,
      },
    });
  }
});

// Milestone 2: '/refund-lesson'
// Refunds a lesson payment.  Refund the payment from the customer (or cancel the auth
// if a payment hasn't occurred).
// Sets the refund reason to 'requested_by_customer'
//
// Parameters:
// payment_intent_id: the payment intent to refund
// amount: (optional) amount to refund if different than the original payment
//
// Example call:
// curl -X POST http://localhost:4242/refund-lesson \
//   -d payment_intent_id=pi_XXX \
//   -d amount=2500
//
// Returns
// If the refund is successfully created returns a JSON response of the format:
//
// {
//   refund: refund.id
// }
//
// If there was an error:
//  {
//    error: {
//        code: e.error.code,
//        message: e.error.message
//      }
//  }
app.post("/refund-lesson", async (req, res) => {
  try {
    const { payment_intent_id, amount } = req.body;
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount: amount,
    });

    res.status(200).send({
      refund: refund.id,
    });
  } catch (error) {
    console.log("refund lesson", error);
    return res.status(400).send({
      error: {
        code: error.code,
        message: error.raw?.message,
      },
    });
  }
});

// Milestone 3: Managing account info
// Displays the account update page for a given customer
app.get("/account-update/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;
    const customer = await stripe.customers.retrieve(customer_id);
    const paymentMethods = await stripe.customers.listPaymentMethods(
      customer_id,
      { type: "card" }
    );
    const { card, id } = paymentMethods.data[0];
    // res.status(200).send(customer);

    //updated name and email is not comming here
    res.status(200).send({
      payment_method: id,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      last4: card.last4,
      name: customer.name,
      email: customer.email,
    });
  } catch (error) {
    console.log("account update get", error);
    return res
      .status(400)
      .send({ error: { code: error.code, message: error.raw?.message } });
  }
});

app.post("/account-update/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;
    const data = req.body;
    const { name, email, payment_method, token } = data;

    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });
    if (customers.data.length > 0 && customers.data[0].id !== customer_id) {
      return res.status(403).send({
        error: "Customer email already exists",
      });
    }

    const customer = await stripe.customers.update(customer_id, {
      name,
      email,
    });

    if (!token && customer) {
      return res.status(200).send(customer);
    }
    const listPaymentMethods = await stripe.customers.listPaymentMethods(
      customer_id,
      { type: "card" }
    );
    const listPayment = listPaymentMethods.data.filter(
      (pm) => pm.id === payment_method
    );
    if (listPayment[0]?.id) {
      const detachedPaymentMethod = await stripe.paymentMethods.detach(
        payment_method
      );
    }
    console.log(
      "list payment",
      listPayment,
      "listPaymentMethods",
      listPaymentMethods,
      "payment method",
      payment_method
    );
    // const paymentMethod = await stripe.paymentMethods.update(payment_method, {
    //   billing_details: { name, email },
    // });
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
        },
      },
    });

    await stripe.customers.createSource(customer.id, {
      source: token.id,
    });

    // const result = {customer}
    res.status(200).send({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.log("account update post", error);
    return res
      .status(400)
      .send({ error: { code: error.code, message: error.raw?.message } });
  }
});
// Milestone 3: '/delete-account'
// Deletes a customer object if there are no uncaptured payment intents for them.
//
// Parameters:
//   customer_id: the id of the customer to delete
//
// Example request
//   curl -X POST http://localhost:4242/delete-account/:customer_id \
//
// Returns 1 of 3 responses:
// If the customer had no uncaptured charges and was successfully deleted returns the response:
//   {
//        deleted: true
//   }
//
// If the customer had uncaptured payment intents, return a list of the payment intent ids:
//   {
//     uncaptured_payments: ids of any uncaptured payment intents
//   }
//
// If there was an error:
//  {
//    error: {
//        code: e.error.code,
//        message: e.error.message
//      }
//  }
//

app.post("/delete-account/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer_id,
      limit: 5,
    });

    const payment_intent_ids = [];
    var isPaymentCaptured = false;

    paymentIntents.data.forEach((item) => {
      // Checking for uncaptured payment intents
      if (item.status === "succeeded") {
        isPaymentCaptured = true;
      } else {
        payment_intent_ids.push(item.id);
      }
    });

    if (payment_intent_ids.length < 1 || isPaymentCaptured) {
      const deleted = await stripe.customers.del(customer_id);

      res.status(200).send({
        deleted: deleted.deleted,
        uncaptured_payments: payment_intent_ids,
      });
    } else {
      res.status(200).send({
        uncaptured_payments: payment_intent_ids,
      });
    }
  } catch (error) {
    console.log("delete account", error);
    return res
      .status(400)
      .send({ error: { code: error.code, message: error.raw?.message } });
  }
});

// Milestone 4: '/calculate-lesson-total'
// Returns the total amounts for payments for lessons, ignoring payments
// for videos and concert tickets.

// Example call: curl -X GET http://localhost:4242/calculate-lesson-total

// Returns a JSON response of the format:
// {
//  payment_total: total before fees and refunds (including disputes), and excluding payments that haven't yet been captured.
//     This should be equivalent to net + fee totals.
//      fee_total: total amount in fees that the store has paid to Stripe
//      net_total: net amount the store has earned from the payments.
// }

app.get("/calculate-lesson-total", async (req, res) => {
  try {
    // let currentTime = Date.now() / 1000;
    // currentTime = Math.floor(currentTime);
    // let todaysStartTime = new Date();
    // //today's start time in second
    // todaysStartTime = todaysStartTime.setUTCHours(0, 0, 0, 0) / 1000;

    // const numOfDays = 86400 * 7; //number of days in sec

    // // start of the last week in utc
    // const interval_start = todaysStartTime - numOfDays;

    let payment_total = 0,
      net_total = 0,
      fee_total = 0;
    refund = 0;
    let charges = {};

    const checkHasMore = async () => {
      charges = await stripe.charges.list({
        // created: {
        //   gte: interval_start,
        // },
        expand: ["data.balance_transaction"],
      });

      charges.data.forEach((charge) => {
        const { balance_transaction, amount_refunded, metadata } = charge;
        if (metadata.type === "lessons-payments") {
          if (balance_transaction) {
            payment_total += balance_transaction.amount - amount_refunded;
            fee_total += balance_transaction.fee;
          }
        }
      });

      net_total = payment_total - fee_total;
    };
    await checkHasMore();

    res.status(200).send({
      payment_total,
      fee_total,
      net_total,
    });
  } catch (error) {
    console.log("lesson total route", error);
    return res
      .status(500)
      .send({ error: { code: error.code, message: error.raw?.message } });
  }
});

// Milestone 4: '/find-customers-with-failed-payments'
// Returns any customer who meets the following conditions:
// The last attempt to make a payment for that customer failed.
// The payment method associated with that customer is the same payment method used
// for the failed payment, in other words, the customer has not yet supplied a new payment method.

// Example request: curl -X GET http://localhost:4242/find-customers-with-failed-payments

// Returns a JSON response with information about each customer identified and
// their associated last payment
// attempt and, info about the payment method on file.
// [
//   <customer_id>: {
//     customer: {
//       email: customer.email,
//       name: customer.name,
//     },
//     payment_intent: {
//       created: created timestamp for the payment intent
//       description: description from the payment intent
//       status: the status of the payment intent
//       error: the error returned from the payment attempt
//     },
//     payment_method: {
//       last4: last four of the card stored on the customer
//       brand: brand of the card stored on the customer
//     }
//   },
//   <customer_id>: {},
//   <customer_id>: {},
// ]
app.get("/find-customers-with-failed-payments", async (req, res) => {
  try {
    let response = {};
    let todaysStartTime = new Date();
    //today's start time in seconds
    todaysStartTime = todaysStartTime.setUTCHours(0, 0, 0, 0) / 1000;

    //number of days in seconds
    const numOfDaysInSec = 86400 * 7;

    // start of the last week in utc
    const interval_start = todaysStartTime - numOfDaysInSec;

    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      // created: {
      //   gte: interval_start,
      // },
    });

    const customers = await stripe.customers.list({ limit: 100 });
    outerLoop: for (const customer of customers.data) {
      for (const paymentIntent of paymentIntents.data) {
        const { status } = paymentIntent;
        if (status !== "succeded") {
          // const customer = await stripe.customers.retrieve(
          //   paymentIntent.customer
          // );
          // const paymentIntent = await stripe.paymentIntents.retrieve(
          //   payment_intent
          // );
          if (
            paymentIntent.last_payment_error?.source?.id ===
            customer.default_source
          ) {
            console.log(customer.id);
            response[customer.id] = {
              customer: {
                email: customer.email,
                name: customer.name,
              },
              payment_intent: {
                created: paymentIntent.created,
                description: paymentIntent.description,
                status: "failed",
                error: "issuer_declined",
              },
              payment_method: {
                last4: paymentIntent.last_payment_error.source.last4,
                brand:
                  paymentIntent.last_payment_error.source.brand.toLowerCase(),
              },
            };
            break outerLoop;
          }
        }
      }
    }
    console.log([response]);
    res.status(200).send([response]);
  } catch (error) {
    console.log("failed payment route", error);
    return res
      .status(500)
      .send({ error: { code: error.code, message: error.raw?.message } });
  }
});

function errorHandler(err, req, res, next) {
  res.status(500).send({ error: { message: err.message } });
}

app.use(errorHandler);

app.listen(4242, () =>
  console.log(`Node server listening on port http://localhost:${4242}`)
);
