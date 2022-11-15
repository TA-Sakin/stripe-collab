import React, { Suspense } from "react";
import { Router } from "@reach/router";

import Home from "../pages/Home";
import Videos from "../pages/Videos";
import Concert from "../pages/Concert";
import Lessons from "../pages/Lessons";
import ConcertSuccess from "../pages/ConcertSuccess";
import AccountUpdate from "../pages/AccountUpdate";

import "../css/normalize.scss";
import "../css/eco-nav.scss";

const App = () => {
  return (
    <Suspense fallback="loading">
      {
        // Routes for principal UI sections.
        // Concert Tickets Challenge: /concert
        // Online Video Purchase: /video
        // Online Lessons: /lessons
      }
      <Router>
        <Home path="/" />
        <Videos path="/videos" />
        <Concert path="/concert" />
        <ConcertSuccess path="/concert-success/:id" />
        <Lessons path="/lessons" />
        <AccountUpdate path="/account-update/:id" />
      </Router>
    </Suspense>
  );
};

export default App;
