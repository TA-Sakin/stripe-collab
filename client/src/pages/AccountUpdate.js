import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import "../css/lessons.scss";
import { accountUpdate } from "../Services/account";
import UpdateCustomer from "../components/UpdateCustomer";

//Component responsable to update user's info.
const AccountUpdate = ({ id }) => {
  const [data, setData] = useState({});
  const [reload, setReload] = useState(false);
  //Get info to load page, User payment information, config API route in package.json "proxy"

  useEffect(() => {
    const setup = async () => {
      const result = await accountUpdate(id);
      if (result !== null) {
        console.log(result);
        setData(result);
      }
    };
    setup();
  }, [id, reload]);
  // console.log("data", data);
  // if (!data?.email) return;
  return (
    <main className="main-lessons">
      <Header />
      <div className="eco-items" id="account-information">
        {
          //User's info should be display here
        }
        <h3>Account Details</h3>
        <h4>Current Account information</h4>
        <h5>We have the following card information on file for you: </h5>
        <p>
          <span id="billing-email">Billing Email: {data.email}</span>
        </p>
        <p>
          <span id="card-exp-month"> Card Exp Month: {data.exp_month}</span>
        </p>
        <p>
          <span id="card-exp-year">Card Exp Year: {data.exp_year}</span>
        </p>
        <p>
          <span id="card-last4">Card last 4: {data.last4}</span>
        </p>
      </div>
      <UpdateCustomer
        name={data.name}
        email={data.email}
        customer_id={id}
        payment_method={data.payment_method}
        setReload={setReload}
      />
    </main>
  );
};

export default AccountUpdate;
