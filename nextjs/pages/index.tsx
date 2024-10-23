import TradingViewWidget from '@/components/TVChartContainer';
import React, { useState } from 'react';

const App = () => {
  const [tokenAddress, setTokenAddress] = useState('default-token');

  return (
    <div>
      <h1>TradingView Widget</h1>
      <TradingViewWidget tokenAddress={tokenAddress} />
    </div>
  );
};

export default App;
