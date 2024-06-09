'use client'

// components/BitcoinChart.tsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { ChartData, ChartOptions } from 'chart.js';

interface PricePoint {
  x: Date;
  y: number;
}

const BitcoinChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData<'line', PricePoint[]>>({
    datasets: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30');
      const data = await response.json();

      const prices: PricePoint[] = data.prices.map((price: [number, number]) => ({
        x: new Date(price[0]),
        y: price[1],
      }));

      setChartData({
        datasets: [{
          label: 'Bitcoin Price',
          data: prices,
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
          fill: true,
        }]
      });
    };

    fetchData();
  }, []);

  const options: ChartOptions<'line'> = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
        },
      },
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div>
      <h2>Bitcoin Price Chart</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default BitcoinChart;