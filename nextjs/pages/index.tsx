import { TVChartContainer } from "@/components/TVChartContainer";
import { useState } from "react";

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("DADDY");

  const handleSubmit = (event) => {
    event.preventDefault();
    const address = event.target[0].value;
    setTokenAddress(address); // Update token address on form submit
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Token Address" />
        <button type="submit">Submit</button>
      </form>

      <TVChartContainer token_address={tokenAddress} />
    </>
  );
}
