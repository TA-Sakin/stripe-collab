import React, { useState, useEffect } from "react";
import "../css/checkout.scss";
import { Link } from "@reach/router";
import { concertSuccess } from "../Services/concert";
import Header from "../components/Header";

//Component to show success after buying concert tickets
const ConcertSuccess = (props) => {
  const { id } = props;
  const [data, setData] = useState(props);

  //Get info to load page, config API route in package.json "proxy"
  useEffect(() => {
    const setup = async () => {
      const result = await concertSuccess(id);
      console.log(result);
      if (result !== null) {
        setData(result);
      }
    };
    setup();
  }, [id]);

  return (
    <main className="main-checkout">
      <Header />
      <div className="checkout-root">
        <div className="checkout-success">
          <header className="sr-header"></header>
          <div className="payment-summary completed-view">
            <img src="/assets/img/success.svg" alt="" />
            <h1 id="headline">Your payment succeeded</h1>
          </div>
          <div className="sr-section completed-view">
            <div className="eco-callout">
              {
                //your information will be display here
              }
              <pre id="payment-info">{JSON.stringify(data, null, 2)}</pre>
            </div>
            <Link to="/concert">
              <button>Return to ticket purchase</button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ConcertSuccess;
