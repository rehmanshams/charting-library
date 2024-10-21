import { useEffect, useRef } from "react";
import {
  widget,
  IChartingLibraryWidget,
  ChartingLibraryWidgetOptions,
} from "@/public/static/charting_library";
import { CustomDatafeed } from "@/public/static/datafeeds/udf/src/custom-datafeed";

export const TVChartContainer = ({ token_address }) => {
  const chartContainerRef = useRef(null); // Reference for the chart container div
  const tvWidgetRef = useRef(null); // Store widget reference to avoid re-initialization

  // Updated useEffect with a slight delay for widget initialization
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Ensure the chart container and widget are available before initializing
      if (chartContainerRef.current && !tvWidgetRef.current) {
        const tvWidget = new widget({
          symbol: token_address,
          interval: "1S" as ChartingLibraryWidgetOptions["interval"],
          container: chartContainerRef.current,
          datafeed: new CustomDatafeed(token_address),
          library_path: "/static/charting_library/",
          locale: "en",
          fullscreen: false,
          autosize: true,
        });

        tvWidgetRef.current = tvWidget; // Store the widget instance
      }
    }, 100); // Slight delay to ensure the DOM is ready

    return () => {
      clearTimeout(timeout); // Clear timeout on unmount or re-render
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove(); // Remove widget on cleanup
        tvWidgetRef.current = null; // Reset widget reference
      }
    };
  }, [token_address]); // Re-run when token_address changes

  return (
    <div ref={chartContainerRef} style={{ height: "800px" }} /> // Chart container
  );
};
