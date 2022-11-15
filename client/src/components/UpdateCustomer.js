import React from "react";
import { Link } from "@reach/router";
import { CardElement } from "@stripe/react-stripe-js";

const UpdateCustomer = () => {
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };
  return (
    <div className="lesson-form">
      <div className="lesson-desc">
        <h3>Update your Payment details</h3>
        <div className="lesson-info">
          Fill out the form below if you'd like to us to use a new card.
        </div>
        <div className="lesson-grid">
          <div className="lesson-inputs">
            <div className="lesson-input-box">
              <input
                type="text"
                id="name"
                placeholder="Name"
                autoComplete="cardholder"
                className="sr-input"
              />
            </div>
            <div className="lesson-input-box">
              <input
                type="text"
                id="email"
                placeholder="Email"
                autoComplete="cardholder"
              />
            </div>
            <div className="lesson-input-box">
              <div className="lesson-card-element">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </div>
          </div>
          <div className="sr-field-error" id="card-errors" role="alert"></div>
          <div
            className="sr-field-error"
            id="customer-exists-error"
            role="alert"
            hidden
          ></div>
        </div>
        <button id="submit" disabled>
          <div className="spinner hidden" id="spinner"></div>
          <span id="button-text">Save</span>
        </button>
        <div className="lesson-legal-info">
          Your new card will be charged when you book your next session.
        </div>
      </div>

      <div className="sr-section hidden completed-view">
        <h3 id="signup-status">Payment Information updated </h3>
        <Link to="/lessons">
          <button>Sign up for lessons under a different email address</button>
        </Link>
      </div>
    </div>
  );
};
export default UpdateCustomer;
