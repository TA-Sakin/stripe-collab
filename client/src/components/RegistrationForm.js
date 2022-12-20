import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React, { useEffect } from "react";
import SignupComplete from "./SignupComplete";
import axios from "axios";
import { useState } from "react";
import { Link } from "@reach/router";
//Registration Form Component, process user info for online session.
//const textSingup = ;
const RegistrationForm = ({ selected, details, sessions }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [active, setActive] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [cardError, setCardError] = useState("");
  const [nameemail, setNameemail] = useState({});
  const [emailError, setEmailError] = useState(false);
  const handleCard = (e) => {
    if (e.complete) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  const handleReady = (e) => {
    setDisabled(false);
  };

  const handleChange = (e) => {
    setNameemail({ ...nameemail, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    //rerender component if name or email changes
  }, [nameemail]);

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
      const { data } = await axios.post("http://localhost:4242/lessons", {
        name,
        email,
        token: token.id,
        first_lesson: sessions[selected].title,
      });
      if (data) {
        setUserInfo({
          name,
          email,
          last4: data.last4,
          customer_id: data.customer_id,
        });
      }
      // if (userInfo?.customer_id) {
      // }
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
            console.log("card setup error", result.error);
            setProcessing(false);
            setCardError(result.error.message);
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
        setEmailError(true);
      } else if (
        error.response?.data.error.message == "Your card was declined."
      ) {
        setCardError("Your card has been declined.");
        setEmailError(false);
      } else if (error.message) {
        setEmailError(true);
        setCardError(error.message);
      } else {
        setEmailError(true);
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

  if (selected !== -1) {
    return (
      <div className={`lesson-form`}>
        <form
          className={`lesson-desc ${active && "hidden"}`}
          onSubmit={handleSubmit}
        >
          <h3>Registration details</h3>
          <div id="summary-table" className="lesson-info">
            {details}
          </div>
          <div className="lesson-grid">
            <div className="lesson-inputs">
              <div className="lesson-input-box first">
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Name"
                  autoComplete="cardholder"
                  className="sr-input"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="lesson-input-box middle">
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="Email"
                  autoComplete="cardholder"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="lesson-input-box last">
                <div className="lesson-card-element">
                  <CardElement
                    onChange={handleCard}
                    onReady={handleReady}
                    options={CARD_ELEMENT_OPTIONS}
                  />
                </div>
              </div>
            </div>
            {cardError && (
              <div className="sr-field-error" id="card-errors" role="alert">
                {cardError}
              </div>
            )}
            <div
              className="sr-field-error"
              id="customer-exists-error"
              role="alert"
              hidden={!error || !emailError}
            >
              A customer with the email address of{" "}
              <span id="error_msg_customer_email"></span> already exists. If
              you'd like to update the card on file, please visit{" "}
              <span id="account_link">
                <Link to={`/account-update/${userInfo.customer_id}`}>
                  localhost:3000/account-update/${userInfo.customer_id}
                </Link>
              </span>
              .
            </div>
          </div>
          {!error && (
            <button
              id="submit"
              type="submit"
              disabled={
                loading ||
                disabled ||
                processing ||
                !nameemail?.name ||
                !nameemail?.email
              }
            >
              <div
                className={`spinner ${!processing ? "hidden" : ""}`}
                id="spinner"
              ></div>
              <span
                className={`${processing ? "hidden" : ""}`}
                id="button-text"
              >
                Request Lesson
              </span>
            </button>
          )}
          <div className="lesson-legal-info">
            Your card will not be charged. By registering, you hold a session
            slot which we will confirm within 24 hrs.
          </div>
        </form>

        <SignupComplete
          active={active}
          email={userInfo.email}
          last4={userInfo.last4}
          customer_id={userInfo.customer_id}
        />
      </div>
    );
  } else {
    return "";
  }
};
export default RegistrationForm;
