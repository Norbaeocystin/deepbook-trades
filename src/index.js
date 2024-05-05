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
const candlestickSeries = chart.addCandlestickSeries({
  upColor: "#26a69a",
  downColor: "#ef5350",
  borderVisible: false,
  wickUpColor: "#26a69a",
  wickDownColor: "#ef5350",
});
candlestickSeries.applyOptions({
  upColor: "red",
  downColor: "blue",
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

// setting the data for the volume series.
// note: we are defining each bars color as part of the data
volumeSeries.setData([
]);

const candlesLow = {};
const candlesOpen = {};
const candlesHigh = {};

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
      const timeMin = Math.floor(+new Date() / (60 * 1000));
      const price = Number(event.parsedJson.price) / 1_000_000;
      let open_price = price;
      let low_price = price;
      let high_price = price;
      let close_price = price;
      if (timeMin in candlesOpen) {
        open_price = candlesOpen[timeMin];
        let prev_high_price = candlesHigh[timeMin];
        if (high_price > prev_high_price) {
          candlesHigh[timeMin] = high_price;
        } else {
          high_price = prev_high_price;
        }
        let prev_low_price = candlesLow[timeMin];
        if (low_price < prev_low_price) {
          candlesLow[timeMin] = low_price;
        } else {
          low_price = prev_low_price;
        }
      } else {
        candlesOpen[timeMin] = price;
        candlesHigh[timeMin] = price;
        candlesLow[timeMin] = price;
      }
      const quantity =
        (Number(event.parsedJson.base_asset_quantity_filled) / 1_000_000_000) *
        price;
      console.log(event.parsedJson, "price:", price, "quantity:", quantity);
      // areaSeries.update({ time: start, value: price });
      candlestickSeries.update({
        timeMin,
        open_price,
        high_price,
        low_price,
        close_price,
      });
      const bid = event.parsedJson.is_bid;
      const color = bid == true ? "#ef5350" : "#26a69a";
      volumeSeries.update({ time: start, value: quantity, color: color });
    },
  });
}
run();
