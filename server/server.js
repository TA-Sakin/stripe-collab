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
    // console.log("customers list", customers);

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
    // console.log("create customer", customer);

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
    });

    await stripe.customers.createSource(customer.id, {
      source: token,
    });
    // console.log("card", card);

    res.send({
      clientSecret: setupIntent.client_secret,
      customer_id: setupIntent.customer,
    });
  } catch (e) {
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
  const data = req.body;
  const { customer_id, amount, description } = data;
  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(
      customer_id,
      { type: "card" }
    );
    // declind card: cus_MocwKDbXRZbSn0
    // valid cus: cus_MogNhLXiZmKqY9
    if (paymentMethods.data.length < 1) {
      console.log("paymentMethods", paymentMethods);
      return res.status(404).json({
        error: {
          message: "no payment methods found for " + customer_id,
        },
      });
    }
    // console.log("payment methods", paymentMethods);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "inr",
      customer: customer_id,
      // payment_method: paymentMethods.data[0].id,
      // off_session: true,
      confirm: true,
      // payment_method_types: ["card"],
      // capture_method: "manual",
      description,
      metadata: { type: "lessons-payment" },
    });

    console.log("paymentIntent", paymentIntent);
    res.status(200).send({ payment: paymentIntent });
  } catch (error) {
    console.log(error);
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
    console.log("data", paymentIntent);
    res.status(200).send({ payment: paymentIntent });
  } catch (error) {
    console.log(error);
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
    // console.log(refund);
    res.status(200).send({
      refund: refund.id,
    });
  } catch (error) {
    console.log(error);
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
    console.log(error);
    return res
      .status(400)
      .send({ error: { code: error.code, message: error.raw?.message } });
  }
});

app.post("/account-update/:customer_id", async (req, res) => {
  try {
    const { customer_id } = req.params;
    const data = req.body;
    const { name, email, payment_method, token, emailChanged } = data;
    // console.log(name, email, payment_method);
    if (emailChanged) {
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return res.status(403).json({
          message: "Email already exist",
          customer_id: customers.data[0].id,
        });
      }
    }
    // console.log("customers list", customers);

    const customer = await stripe.customers.update(customer_id, {
      name,
      email,
    });

    console.log("customer", customer);
    const paymentMethod = await stripe.paymentMethods.update(payment_method, {
      billing_details: { name, email },
    });
    console.log("paymentMethod", paymentMethod);

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
    });

    await stripe.customers.createSource(customer.id, {
      source: token.id,
    });
    // const result = {customer}
    res.status(200).send({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.log(error);
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

app.post("/delete-account/:customer_id", async (req, res) => {});

// Milestone 4: '/calculate-lesson-total'
// Returns the total amounts for payments for lessons, ignoring payments
// for videos and concert tickets.
//
// Example call: curl -X GET http://localhost:4242/calculate-lesson-total
//
// Returns a JSON response of the format:
// {
//      payment_total: total before fees and refunds (including disputes), and excluding payments
//         that haven't yet been captured.
//         This should be equivalent to net + fee totals.
//      fee_total: total amount in fees that the store has paid to Stripe
//      net_total: net amount the store has earned from the payments.
// }
//
app.get("/calculate-lesson-total", async (req, res) => {});

// Milestone 4: '/find-customers-with-failed-payments'
// Returns any customer who meets the following conditions:
// The last attempt to make a payment for that customer failed.
// The payment method associated with that customer is the same payment method used
// for the failed payment, in other words, the customer has not yet supplied a new payment method.
//
// Example request: curl -X GET http://localhost:4242/find-customers-with-failed-payments
//
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
app.get("/find-customers-with-failed-payments", async (req, res) => {});

function errorHandler(err, req, res, next) {
  res.status(500).send({ error: { message: err.message } });
}

app.use(errorHandler);

app.listen(4242, () =>
  console.log(`Node server listening on port http://localhost:${4242}`)
);
