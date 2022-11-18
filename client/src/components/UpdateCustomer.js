import React from "react";
import { Link } from "@reach/router";
import { CardElement } from "@stripe/react-stripe-js";

const UpdateCustomer = () => {
  const handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();
    setCardError("");
    setProcessing(true);
    const card = elements?.getElement(CardElement);
    const name = event.target.name.value;
    const email = event.target.email.value;
    // console.log(name, email);
    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    if (card === null) {
      return;
    }
    try {
      const { token, error } = await stripe.createToken(card);
      if (error) {
        throw error;
      }
      // console.log(token);

      const { data } = await axios.post("http://localhost:4242/lessons", {
        name,
        email,
        token: token.id,
        first_lesson: sessions[selected].title,
      });

      setUserInfo({
        name,
        email,
        last4: token.card.last4,
        customer_id: data.customer_id,
      });

      stripe
        .confirmCardSetup(data.clientSecret, {
          payment_method: {
            card,
            billing_details: {
              name,
              email,
            },
          },
        })
        .then(function (result) {
          if (result.error) {
            // setActive(false);
            setProcessing(false);
            setCardError(result.error.message);
            console.log(card);
          } else {
            if (result.setupIntent.status === "succeeded") {
              setActive(true);
              setProcessing(false);
            }
          }
        });
    } catch (error) {
      setProcessing(false);

      if (error.response?.status === 403) {
        setUserInfo({
          ...userInfo,
          customer_id: error.response.data?.customer_id,
        });
        setError(true);
      } else if (
        error.response?.data.error.message == "Your card was declined."
      ) {
        setCardError("Your card has been declined.");
      } else if (error.message) {
        setCardError(error.message);
      } else {
        setCardError(error);
      }
    }
  };
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
      <form onSubmit={handleSubmit} className="lesson-desc">
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
                <CardElement
                  onChange={handleCard}
                  onReady={handleReady}
                  options={CARD_ELEMENT_OPTIONS}
                />
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
      </form>

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
