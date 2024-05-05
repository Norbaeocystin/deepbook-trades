import { createChart } from "lightweight-charts";
import { SuiClient } from "@mysten/sui.js/client";

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io:443" });

// REPLACE EVERYTHING BELOW HERE
const chartOptions = {
  layout: {
    textColor: "black",
    background: { type: "solid", color: "white" },
  },
  rightPriceScale: {
    borderVisible: false,
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
  },
};

const chart = createChart(document.getElementById("container"), chartOptions);

const areaSeries = chart.addAreaSeries({
  topColor: "#2962FF",
  bottomColor: "rgba(41, 98, 255, 0.28)",
  lineColor: "#2962FF",
  lineWidth: 2,
});
areaSeries.priceScale().applyOptions({
  scaleMargins: {
    // positioning the price scale for the area series
    top: 0.1,
    bottom: 0.4,
  },
});

const volumeSeries = chart.addHistogramSeries({
  color: "#26a69a",
  priceFormat: {
    type: "volume",
  },
  priceScaleId: "", // set as an overlay by setting a blank priceScaleId
  // set the positioning of the volume series
  scaleMargins: {
    top: 0.7, // highest point of the series will be 70% away from the top
    bottom: 0,
  },
});
volumeSeries.priceScale().applyOptions({
  scaleMargins: {
    top: 0.7, // highest point of the series will be 70% away from the top
    bottom: 0,
  },
});

areaSeries.setData([
  // { time: "2018-10-19", value: 54.9 },
  // { time: "2018-10-22", value: 54.98 },
  // { time: "2018-10-23", value: 57.21 },
  // { time: "2018-10-24", value: 57.42 },
  // { time: "2018-10-25", value: 56.43 },
  // { time: "2018-10-26", value: 55.51 },
]);

// setting the data for the volume series.
// note: we are defining each bars color as part of the data
volumeSeries.setData([
  // { time: "2018-10-19", value: 19103293.0, color: "#26a69a" },
  // { time: "2018-10-22", value: 21737523.0, color: "#26a69a" },
  // { time: "2018-10-23", value: 29328713.0, color: "#26a69a" },
  // { time: "2018-10-24", value: 37435638.0, color: "#26a69a" },
  // { time: "2018-10-25", value: 25269995.0, color: "#ef5350" },
  // { time: "2018-10-26", value: 24973311.0, color: "#ef5350" },
]);

chart.timeScale().fitContent();

async function run() {
  const unsubscribe = await client.subscribeEvent({
    filter: {
      MoveEventType:
        "0xdee9::clob_v2::OrderFilled<0x2::sui::SUI, 0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN>",
    },
    onMessage(event) {
      // handle subscription notification message here. This function is called once per subscription message.
      const start = Math.round(+new Date() / 1000);
      const price = Number(event.parsedJson.price) / 1_000_000;
      const quantity =
        (Number(event.parsedJson.base_asset_quantity_filled) / 1_000_000_000) *
        price;
      console.log(event.parsedJson, "price:", price, "quantity:", quantity);
      areaSeries.update({ time: start, value: price });
      const bid = event.parsedJson.is_bid;
      const color = bid == true ? "#ef5350" : "#26a69a";
      volumeSeries.update({ time: start, value: quantity, color: color });
    },
  });
}
run();
