import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React from "react";
import Thanks from "./Thanks";

//Payment Form, process user information to allow payment.

const PaymentForm = (props) => {
  const { active } = props;
  if (active) {
    return (
      <div>
        <form id="payment-form" className={`sr-payment-form payment-view`}>
          <h3>Payment details</h3>
          <div className="sr-form-row">
            <div className="sr-combo-inputs">
              <div className="sr-combo-inputs-row">
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Name"
                  autoComplete="cardholder"
                  className="sr-input"
                />
              </div>
              <div className="sr-combo-inputs-row">
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="cardholder"
                />
              </div>

              <div className="sr-combo-inputs-row">
                <div
                  id="card-element"
                  className="sr-input sr-card-element"
                ></div>
              </div>
            </div>
            <div className="sr-field-error" id="card-errors" role="alert"></div>
          </div>
          <button id="submit" type="submit">
            <div className="spinner hidden" id="spinner"></div>
            <span id="button-text hidden">Purchase</span>
          </button>
          <div className="legal-text">
            Your card will be immediately charged
          </div>
        </form>
        <Thanks state={false} />
      </div>
    );
  } else {
    return "";
  }
};

export default PaymentForm;
