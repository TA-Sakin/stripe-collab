import React, { useState, useEffect } from "react";
import Items from "../components/Items";
import SummaryTable from "../components/SummaryTable";
import { items_data, config } from "../components/mock_data";
import "../css/global.scss";
import { videoSetup } from "../Services/video";
import Header from "../components/Header";
const Videos = () => {
  const [data, setData] = useState({});
  const [items, setItems] = useState(null);
  const [orderData, setOrderData] = useState([]);

  //Get info to load page, config API route in package.json "proxy"
  useEffect(() => {
    const setup = async () => {
      var result = await videoSetup();

      if (result === null) {
        //use static data
        //comment this code to work with backend only
        result = config;
        result.items = items_data;
      }
      let tempItems = [];
      let i = 0;
      for (let [, item] of Object.entries(result.items)) {
        item.index = i;
        item.selected = false;
        i += 1;
        tempItems.push(item);
      }
      setItems(tempItems);
      setData(result);
    };
    setup();
  }, []);

  //update order
  var updateOrder = (id, index) => {
    let copyItems = items;
    //toggles selected items
    if (!copyItems[index].selected) {
      copyItems[index].selected = true;
      //Add item to order
      setOrderData(orderData.concat(id));
    } else {
      copyItems[index].selected = false;
      //Retire item from order
      setOrderData(orderData.filter((item) => item !== id));
    }
    setItems(copyItems);
  };

  if (items === null) {
    return <h1>loading</h1>;
  }
  return (
    <main className="main-global">
      <Header selected="videos" />
      <div className="video-title" id="title">
        <h2>Video Courses</h2>
      </div>

      <div className="video-instructions">
        Not ready to commit to lessons? These short video courses are designed
        to be fun, quickly teach you something, and let you get to know our
        expert teachers. Once you purchase the course, we&apos;ll send you a
        link to the video and you&apos;ll have access to it forever.
      </div>
      <div className="video-instructions">
        20% discount on purchases of two or more video courses! Discount
        reflected in cart.
      </div>

      <div className="video-body">
        {
          //Show video course
        }
        <Items items={items} action={updateOrder} />
      </div>

      {
        //Show summary table of video selected and calculated the total and disccount
      }
      <SummaryTable
        discountFactor={data.discountFactor}
        minItemsForDiscount={data.minItemsForDiscount}
        items={items}
        order={orderData}
      />
    </main>
  );
};

export default Videos;
