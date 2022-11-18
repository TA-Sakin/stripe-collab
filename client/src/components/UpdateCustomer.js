import React, { useState } from "react";
import { Link } from "@reach/router";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { useEffect } from "react";
let defaultInfo = {
  name: "",
  email: "",
};
const UpdateCustomer = ({
  name,
  email,
  customer_id,
  payment_method,
  setReload,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [active, setActive] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [cardError, setCardError] = useState("");
  const [nameemail, setNameemail] = useState(defaultInfo);

  useEffect(() => {
    setNameemail({ ...nameemail, name, email });
  }, [name, email]);

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
  // http://localhost:3000/account-update/cus_Mozc8lzOsERSRI

  const handleChange = (e) => {
    setNameemail({ ...nameemail, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();
    setCardError("");
    setProcessing(true);
    const card = elements?.getElement(CardElement);

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    if (card === null) {
      return;
    }
    try {
      console.log("nameemail", nameemail);

      const { data } = await axios.post(
        `http://localhost:4242/account-update/${customer_id}`,
        {
          name: nameemail.name,
          email: nameemail.email,
          payment_method,
        }
      );

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
            console.log(result.error);
            setProcessing(false);
            setCardError(result.error.message);
            console.log(card);
          } else {
            if (result.setupIntent.status === "succeeded") {
              setActive(true);
              setProcessing(false);
              setReload((prevState) => !prevState);
            }
          }
        });
    } catch (error) {
      setProcessing(false);
      console.log(error);
      if (error.response?.status === 403) {
        setUserInfo({
          ...userInfo,
          customer_id: error.response.data?.customer_id,
        });
        setError(true);
      } else if (
        error.response?.data.error?.message == "Your card was declined."
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
                name="name"
                placeholder="Name"
                value={nameemail.name}
                autoComplete="cardholder"
                className="sr-input"
                onChange={handleChange}
              />
            </div>
            <div className="lesson-input-box">
              <input
                type="text"
                id="email"
                name="email"
                value={nameemail.email}
                placeholder="Email"
                autoComplete="cardholder"
                onChange={handleChange}
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
          <div className="sr-field-error" id="card-errors" role="alert">
            {cardError}
          </div>
          <div
            className="sr-field-error"
            id="customer-exists-error"
            role="alert"
            hidden={!error}
          >
            Customer email already exists
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
            <span className={`${processing ? "hidden" : ""}`} id="button-text">
              Save
            </span>
          </button>
        )}
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
