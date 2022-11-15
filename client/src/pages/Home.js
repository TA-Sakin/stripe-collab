import React from "react";
import SRECard from "../components/SRECard";
import "../css/global.scss";
import Header from "../components/Header";
//Show home page
const Home = () => {
  return (
    <main className="main-global">
      <Header selected="home" />

      <div className="home-body">
        <div id="sr-items" className="items">
          <SRECard
            id="concert"
            title="Concert Tickets"
            desc="Build a global Checkout (server + client) integration to accept
        online payments"
            img="/assets/img/concert.png"
            route="/concert"
          />
          <SRECard
            id="videos"
            title="Video Course"
            desc="Build a card payment integration using the Payment Intents API and Stripe Elements"
            img="/assets/img/freestocks-org-Fx5rrxSaUtI-unsplash.jpg"
            route="/videos"
          />
          <SRECard
            id="lessons"
            title="Music Lessons"
            desc="Build an off-session integration using the Setup Intents API and
        Stripe Elements"
            img="/assets/img/LessonsHome.png"
            route="/lessons"
          />
        </div>
      </div>
    </main>
  );
};

export default Home;
