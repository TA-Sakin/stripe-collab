import React from "react";
import EcoNav from "./EcoNavigation";

const Header = ({ selected }) => {
  const home = selected === "home";
  const concert = selected === "concert";
  const videos = selected === "videos";
  const lessons = selected === "lessons";

  return (
    <div className="header">
      <EcoNav
        links={[
          { name: "Home", url: "/", selected: home },
          { name: "Concert Tickets", url: "/concert", selected: concert },
          { name: "Video Courses", url: "/videos", selected: videos },
          { name: "Lessons Courses", url: "/lessons", selected: lessons },
        ]}
      />
    </div>
  );
};

export default Header;
