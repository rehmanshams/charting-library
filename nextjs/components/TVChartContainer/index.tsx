import React, { useEffect, useState, useRef } from "react";

// Custom EventSource implementation
class CustomEventSource {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.eventListeners = new Map();
    this.onmessage = null;
    this.onerror = null;
    this.onopen = null;
    this.readyState = 0;
    this.reconnectTimeout = null;
    this.connect();
  }

  connect() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", this.url, true);
    xhr.setRequestHeader("Accept", "text/event-stream");
    xhr.setRequestHeader("Cache-Control", "no-cache");
    xhr.setRequestHeader("x-api-key", "$!aqkhan88!$");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3) {
        const data = xhr.responseText;
        this.processStreamData(data);
      } else if (xhr.readyState === 4) {
        if (xhr.status !== 200) {
          if (this.onerror) {
            this.onerror(new Error(`Failed to connect: ${xhr.status}`));
          }
          this.reconnect();
        }
      }
    };

    xhr.onerror = () => {
      if (this.onerror) {
        this.onerror(new Error("Connection error"));
      }
      this.reconnect();
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        if (this.onopen) {
          this.onopen();
        }
        this.readyState = 1;
      }
    };

    try {
      xhr.send();
      this.xhr = xhr;
    } catch (error) {
      if (this.onerror) {
        this.onerror(error);
      }
      this.reconnect();
    }
  }

  processStreamData(data) {
    const lines = data.split("\n");
    let event = { data: "", event: "message" };

    lines.forEach((line) => {
      if (line.startsWith("data: ")) {
        event.data = line.slice(6);
        this.dispatchEvent(event);
      } else if (line.startsWith("event: ")) {
        event.event = line.slice(7);
      }
    });
  }

  dispatchEvent(event) {
    if (event.event === "message" && this.onmessage) {
      this.onmessage({ data: event.data });
    }

    const listeners = this.eventListeners.get(event.event);
    if (listeners) {
      listeners.forEach((listener) => {
        listener({ data: event.data });
      });
    }
  }

  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  reconnect() {
    this.close();
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  close() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
    this.readyState = 2;
  }
}

const TradingChart = () => {
  const [clientId, setClientId] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [tvScriptLoaded, setTvScriptLoaded] = useState(false);
  const chartContainerRef = useRef(null);
  const widgetRef = useRef(null);
  const sourceRef = useRef(null);

  class Datafeed {
    constructor(token_address) {
      this.token_address = token_address;
      this.o = 0;
      this.h = 0;
      this.l = 0;
      this.c = 0;
      this.v = 0;
      this.lastSecond = 0;
      this.dedup = new Map();
      this.eventHandler = null;
    }

    onReady(callback) {
      console.log("[onReady]: Method call");
      setTimeout(() =>
        callback({
          supported_resolutions: ["1S", "1", "60"],
          currency_codes: ["USD"],
          supports_search: true,
          has_seconds: true,
          enabled_features: ["seconds_resolution"],
        })
      );
    }

    async searchSymbols(
      userInput,
      exchange,
      symbolType,
      onResultReadyCallback
    ) {
      onResultReadyCallback([
        {
          symbol: this.token_address,
          full_name: "DADDY TATE",
          description: "DADDY TATE/USD",
          exchange: "Raydium AMM V4",
          ticker: "DADDY",
          type: "crypto",
        },
      ]);
    }

    async resolveSymbol(
      symbolName,
      onSymbolResolvedCallback,
      onResolveErrorCallback
    ) {
      try {
        const symbolInfo = {
          ticker: "DADDY",
          name: this.token_address,
          description: "DADDY TATE/USD",
          type: "crypto",
          session: "24x7",
          timezone: "Etc/UTC",
          exchange: "Raydium AMM V4",
          minmov: 1,
          pricescale: 1000000000,
          has_seconds: true,
          has_intraday: true,
          visible_plots_set: "ohlcv",
          has_weekly_and_monthly: false,
          supported_resolutions: ["1S", "1", "60", "1D", "1W"],
          volume_precision: 2,
          data_status: "streaming",
        };
        onSymbolResolvedCallback(symbolInfo);
      } catch (err) {
        onResolveErrorCallback(err.message);
      }
    }

    subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID) {
      try {
        const filters = [`transaction:${this.token_address}`];

        fetch(`https://api.launchapex.io/v1/events/filter/${clientId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "$!aqkhan88!$",
          },
          body: JSON.stringify({ filters }),
        }).then((response) => {
          if (response.ok) {
            this.eventHandler = (event) => {
              const data = JSON.parse(event.data);
              data.forEach((t) => {
                if (this.dedup.has(t.tx)) return;

                this.dedup.set(t.tx, true);
                const price = t.priceUsd;
                const volume = t.volume;
                const currentSecond = Math.floor(t.time / 1000);
                const lastSecond = Math.floor(this.lastSecond / 1000);

                if (currentSecond !== lastSecond) {
                  if (this.lastSecond > 0) {
                    onRealtimeCallback({
                      time: lastSecond * 1000,
                      open: this.o,
                      high: this.h,
                      low: this.l,
                      close: this.c,
                      volume: this.v,
                    });
                  }

                  this.o = this.h = this.l = this.c = price;
                  this.v = volume;
                } else {
                  this.h = Math.max(this.h, price);
                  this.l = Math.min(this.l, price);
                  this.c = price;
                  this.v += volume;
                }

                this.lastSecond = t.time;
              });

              if (this.dedup.size > 300) {
                this.dedup.clear();
              }
            };

            sourceRef.current?.addEventListener(
              `transaction:${this.token_address}`,
              this.eventHandler
            );
          }
        });
      } catch (err) {
        console.error("Error:", err);
      }
    }

    unsubscribeBars(listenerGuid) {
      if (this.eventHandler) {
        sourceRef.current?.removeEventListener(
          `transaction:${this.token_address}`,
          this.eventHandler
        );
        this.eventHandler = null;
      }

      fetch(`https://api.launchapex.io/v1/events/filter/clear/${clientId}`, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "$!aqkhan88!$",
        },
      });
    }

    getBars(
      symbolInfo,
      resolution,
      periodParams,
      onHistoryCallback,
      onErrorCallback
    ) {
      if (!periodParams.firstDataRequest) {
        onHistoryCallback([], { noData: true });
        return;
      }

      const url = `https://api.launchapex.io/v1/chart/history/${symbolInfo.name}?start=${periodParams.from}&end=${periodParams.to}&limit=${periodParams.countBack}`;

      fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "$!aqkhan88!$",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          const bars = data.map((bar) => ({
            time: new Date(bar.time).getTime(),
            open: bar.ohlcv[0],
            high: bar.ohlcv[1],
            low: bar.ohlcv[2],
            close: bar.ohlcv[3],
            volume: bar.ohlcv[4],
          }));

          if (bars.length === 0) {
            onHistoryCallback([], { noData: true });
            return;
          }

          const lastBar = bars[bars.length - 1];
          this.o = lastBar.open;
          this.h = lastBar.high;
          this.l = lastBar.low;
          this.c = lastBar.close;
          this.v = lastBar.volume;
          this.lastSecond = lastBar.time;

          onHistoryCallback(bars, { noData: false });
        })
        .catch((error) => {
          console.error("Error fetching bars:", error);
          onErrorCallback(error);
        });
    }
  }

  useEffect(() => {
    setIsClient(true);

    const script = document.createElement("script");
    script.src = "/static/charting_library/charting_library.js";
    script.async = true;
    script.onload = () => {
      console.log("TradingView library loaded successfully");
      setTvScriptLoaded(true);
    };
    script.onerror = (error) => {
      console.error("Error loading TradingView library:", error);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const initEventSource = () => {
      const eventSource = new CustomEventSource(
        "https://api.launchapex.io/v1/events"
      );

      sourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("EventSource connection opened");
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
      };

      eventSource.addEventListener("connected", (event) => {
        try {
          const { clientId: newClientId } = JSON.parse(event.data);
          console.log("Connected with clientId:", newClientId);
          setClientId(newClientId);
        } catch (err) {
          console.error("Error parsing connected event:", err);
        }
      });
    };

    initEventSource();

    return () => {
      if (sourceRef.current) {
        sourceRef.current.close();
      }
    };
  }, [isClient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isClient || !tvScriptLoaded) {
      console.error("TradingView library not loaded yet");
      return;
    }

    const tokenAddress = e.target[0].value;
    if (!tokenAddress) {
      console.error("Token address is required");
      return;
    }

    try {
      if (widgetRef.current) {
        widgetRef.current.remove();
      }

      const container = document.getElementById("tv_chart_container");
      if (!container) {
        console.error("Chart container not found");
        return;
      }

      container.innerHTML = "";

      console.log("Initializing widget for token:", tokenAddress);

      widgetRef.current = new window.TradingView.widget({
        symbol: tokenAddress,
        interval: "1S",
        container: "tv_chart_container",
        datafeed: new Datafeed(tokenAddress),
        library_path: "/static/charting_library/",
        theme: "dark",
        timezone: "Etc/UTC",
        debug: true,
        autosize: true,
        disabled_features: ["use_localstorage_for_settings"],
        enabled_features: ["study_templates"],
        charts_storage_url: "https://saveload.tradingview.com",
        client_id: "tradingview.com",
        user_id: "public_user",
        fullscreen: false,
        width: "100%",
        height: 600,
      });

      console.log("Widget initialized successfully");
    } catch (error) {
      console.error("Error creating widget:", error);
    }
  };

  if (!isClient) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100">
        <p>Loading chart...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <label
          htmlFor="tokenAddress"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Token Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="tokenAddress"
            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter token address"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={!tvScriptLoaded}
          >
            {tvScriptLoaded ? "Load Chart" : "Loading..."}
          </button>
        </div>
      </form>
      <div
        id="tv_chart_container"
        ref={chartContainerRef}
        className="border rounded-lg"
        style={{ height: "600px" }}
      />
    </div>
  );
};

export default TradingChart;
