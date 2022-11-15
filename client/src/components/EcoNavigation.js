import React from "react";
import { Link } from "@reach/router";
//Show Nav Menu
const EcoNav = ({ links }) => {
  return (
    <nav>
      <div className="logo">
        <img src="/assets/img/logo.svg" alt="logo music store" />
      </div>
      <ul className={`eco-navigation`}>
        {links.map((link) => (
          <li key={link.name.replace(" ", "")}>
            {link.selected ? (
              <Link to={link.url} className="current">
                {link.name}
              </Link>
            ) : (
              <Link to={link.url}>{link.name}</Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default EcoNav;
