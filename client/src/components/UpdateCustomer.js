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
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [cardError, setCardError] = useState("");
  const [nameemail, setNameemail] = useState(defaultInfo);
  const [cardInserted, setCardInserted] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  useEffect(() => {
    setNameemail({ ...nameemail, name, email });
  }, [name, email]);

  const handleCard = (e) => {
    console.log("handle card", e);
    if (!e.complete) {
      setLoading(true);
    }
    if (e.empty) {
      setLoading(false);
    }
    // if (e.empty && !e.complete) {
    // }
    if (e.complete) {
      setLoading(false);
      setCardInserted(true);
    }
  };

  const handleReady = (e) => {
    setDisabled(false);
  };
  // http://localhost:3000/account-update/cus_Mozc8lzOsERSRI

  const handleChange = (e) => {
    if (e.target.name === "email") {
      setEmailError(false);
      setEmailChanged(true);
    }
    setNameemail({ ...nameemail, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();
    setCardError("");
    if (emailChanged) {
      if (nameemail.email === email) {
        return setEmailError(true);
      }
    }
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
      if (!cardInserted) {
        console.log("card not inserted", cardInserted);
        const { data } = await axios.post(
          `http://localhost:4242/account-update/${customer_id}`,
          {
            name: nameemail.name === "" ? name : nameemail.name,
            email: nameemail.email === "" ? email : nameemail.email,
          }
        );
        if (data) {
          setActive(true);
          setProcessing(false);
          setReload((prevState) => !prevState);
        }
      } else {
        console.log("card inserted", cardInserted);
        const { token, error } = await stripe.createToken(card);
        if (error) {
          console.log("token", error, card);
          throw error;
        }

        const { data } = await axios.post(
          `http://localhost:4242/account-update/${customer_id}`,
          {
            name: nameemail.name === "" ? name : nameemail.name,
            email: nameemail.email === "" ? email : nameemail.email,
            payment_method,
            token,
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
            } else {
              if (result.setupIntent.status === "succeeded") {
                setActive(true);
                setProcessing(false);
                setReload((prevState) => !prevState);
                setNameemail(defaultInfo);
              }
            }
          });
      }
    } catch (error) {
      setProcessing(false);
      if (
        // error.response?.status === 403 ||
        error.response?.data?.message === "Customer email already exists"
      ) {
        console.log(error);
        setEmailError(true);
        // setNameemail({ ...nameemail, email: "" });
      } else if (
        error.response?.data?.error?.message == "Your card was declined."
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
      <form
        className={`lesson-desc ${active && "hidden"}`}
        onSubmit={handleSubmit}
      >
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
          {cardError && (
            <div className="sr-field-error" id="card-errors" role="alert">
              {cardError}
            </div>
          )}
          <div
            className="sr-field-error"
            id="customer-exists-error"
            role="alert"
            hidden={!emailError}
          >
            Customer email already exists
          </div>
        </div>
        <button
          id="submit"
          type="submit"
          disabled={loading || disabled || processing}
        >
          <div
            className={`spinner ${!processing ? "hidden" : ""}`}
            id="spinner"
          ></div>
          <span className={`${processing ? "hidden" : ""}`} id="button-text">
            Save
          </span>
        </button>

        <div className="lesson-legal-info">
          Your new card will be charged when you book your next session.
        </div>
      </form>

      <div className={`sr-section completed-view ${!active && "hidden"}`}>
        <h3 id="signup-status">Payment Information updated </h3>
        <Link to="/lessons">
          <button>Sign up for lessons under a different email address</button>
        </Link>
      </div>
    </div>
  );
};
export default UpdateCustomer;
