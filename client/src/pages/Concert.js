import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getPriceDollars } from "../components/Util";
import Header from "../components/Header";
import "../css/checkout.scss";
import { config } from "../components/mock_data";
import { concertSetup } from "../Services/concert";

//Concert Ticket Component
/*
  This component works with i18n to show messages according to language coonfiguration (lang).
  The content of each message is located in public/locales/lang/translation.json
*/
const MIN_TIXX = 1; //min number of tickets user can buy
const MAX_TIXX = 10; //max number of tickets user can buy

const Concert = () => {
  const [tickets, setTickets] = useState(1); //number of tickets user want to buy
  const [total, setTotal] = useState("$0"); //total price to pay
  const [data, setData] = useState({});
  const t = useTranslation()[0];

  const increaseTicketCount = () => {
    if (tickets < MAX_TIXX) {
      setTickets(tickets + 1);
    }
  };

  const reduceTicketCount = () => {
    if (tickets > MIN_TIXX) {
      setTickets(tickets - 1);
    }
  };
  //Get info to load page, config API route in package.json "proxy"
  useEffect(() => {
    const setup = async () => {
      var result = await concertSetup();
      if (result === null) {
        //use static data
        //comment this code to work with backend only
        result = config;
      }
      setData(result);
    };
    setup();
  }, []);
  //Calculate total when number of tickets changes
  useEffect(() => {
    setTotal(getPriceDollars(tickets * data.basePrice, true));
  }, [data, tickets]);

  return (
    <main className="main-checkout">
      <Header selected="concert" />
      <div className="sr-root">
        <div className="sr-checkout-main">
          <section className="concert-container">
            <div>
              <div className="concert-img">
                <img src="/assets/img/concert.png" alt="" />
              </div>
              <h1 id="headline">{t("headline")}</h1>
              <h2 id="date">{t("date")}</h2>
              <h4 id="sublime">{t("subline")}</h4>
            </div>

            <div className="concert-tickets">
              <div className="concert-price">
                <h3>Standard Ticket</h3>
                <p>{getPriceDollars(data.basePrice, true)}</p>
              </div>
              <div className="quantity-setter">
                <button
                  disabled={tickets <= 1}
                  className="decrement-btn"
                  id="subtract"
                  onClick={() => reduceTicketCount()}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity-input"
                  min="1"
                  max="10"
                  value={tickets}
                  disabled
                />
                <button
                  disabled={tickets >= 10}
                  className="increment-btn"
                  id="add"
                  onClick={() => increaseTicketCount()}
                >
                  +
                </button>
              </div>
            </div>

            <p className="legal-text">{t("sr-legal-text")}</p>

            <button className="button" id="submit">
              {t("button.submit", { total: total })}
            </button>
          </section>
          <div id="error-message"></div>
        </div>
      </div>
    </main>
  );
};

export default Concert;
