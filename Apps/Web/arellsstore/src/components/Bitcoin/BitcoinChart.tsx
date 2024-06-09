// components/BitcoinChart.tsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import styles from '../../app/css/bitcoin/BitcoinChart.module.css'; // Import CSS module

interface PricePoint {
  x: Date;
  y: number;
}

// Register necessary components with Chart.js
Chart.register(...registerables);

// Custom plugin to add a box shadow to the line chart
const shadowPlugin = {
  id: 'shadowPlugin',
  beforeDatasetsDraw: (chart: any) => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(204, 116, 0, 0.5)'; // Customize the shadow color
    ctx.shadowBlur = 10; // Customize the shadow blur
    ctx.shadowOffsetX = 5; // Customize the shadow offset X
    ctx.shadowOffsetY = 5; // Customize the shadow offset Y
  },
  afterDatasetsDraw: (chart: any) => {
    const ctx = chart.ctx;
    ctx.restore();
  },
};

const fetchHistoricalData = async (): Promise<PricePoint[]> => {
  const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30');
  const data = await response.json();

  return data.prices.map((price: [number, number]) => ({
    x: new Date(price[0]),
    y: price[1],
  }));
};

const fetchLatestPrice = async (): Promise<PricePoint> => {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const data = await response.json();

  return { x: new Date(), y: data.bitcoin.usd };
};

const filterPriceData = (prices: PricePoint[]): PricePoint[] => {
  const filteredPrices: PricePoint[] = [];
  let lastValidPrice = prices[0]?.y;

  for (const price of prices) {
    if (price.y >= lastValidPrice) {
      filteredPrices.push(price);
      lastValidPrice = price.y;
    } else {
      filteredPrices.push({ x: price.x, y: lastValidPrice });
    }
  }

  return filteredPrices;
};

const BitcoinChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData<'line', PricePoint[]>>({
    datasets: [],
  });
  const [minDate, setMinDate] = useState<number | undefined>(undefined);
  const [maxDate, setMaxDate] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateChartData = async () => {
      const historicalPrices = await fetchHistoricalData();
      const latestPrice = await fetchLatestPrice();

      // Ensure the latest date is included in the dataset
      const latestDate = new Date(); // Today's date
      console.log('Latest Date:', latestDate);

      // Combine historical and latest prices
      let allPrices = [...historicalPrices];

      // Filter out any negative price changes
      let filteredPrices = filterPriceData(allPrices);

      // Ensure the latest date is included and stagnant line on price drop
      const lastValidPrice = filteredPrices[filteredPrices.length - 1]?.y;
      if (latestPrice.y < lastValidPrice) {
        filteredPrices.push({ x: latestDate, y: lastValidPrice });
      } else {
        filteredPrices.push({ x: latestDate, y: latestPrice.y });
      }

      // Calculate the min and max dates based on the calendar
      const maxDate = latestDate.getTime();
      const minDate = new Date(maxDate - 29 * 24 * 60 * 60 * 1000).getTime(); // Last 30 days

      // Filter the data to include only the last 30 days
      filteredPrices = filteredPrices.filter(price => price.x.getTime() >= minDate);

      setMinDate(minDate);
      setMaxDate(maxDate);

      setChartData({
        datasets: [{
          label: 'Bitcoin',
          data: filteredPrices,
          borderColor: 'rgba(204, 116, 0, 0.5)',
          backgroundColor: 'rgba(75,192,192,0.0)',
          pointRadius: 0, // Remove points
          pointHoverRadius: 0, // Remove points on hover
          pointBorderWidth: 1.5,
          cubicInterpolationMode: 'monotone', // Smooth out the line
          tension: 0.4, // Adjust the tension to further smooth the line (range 0-1)
          fill: false,
          borderWidth: 10, // Increase line width
        }]
      });
    };

    updateChartData(); // Initial fetch
    const intervalId = setInterval(updateChartData, 60000); // Fetch data every minute

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const options: ChartOptions<'line'> = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM d',
          displayFormats: {
            day: 'MMM d',
          },
        },
        adapters: {
          date: {
            locale: enUS,
          },
        },
        ticks: {
          display: false, // Hide the ticks
        },
        grid: {
          display: false, // Remove x-axis grid lines
        },
        border: {
          display: false, // Remove x-axis border
        },
        min: minDate,
        max: maxDate,
      },
      y: {
        beginAtZero: false,
        ticks: {
          color: 'rgba(204, 116, 0, 0.5)', // Customize y-axis tick color
          font: {
            size: 10, // Set font size
            weight: 800, // Set font weight
          },
          callback: (value) => `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`, // Add $ sign and comma separators
        },
        grid: {
          display: false, // Remove y-axis grid lines
        },
        border: {
          display: false, // Remove y-axis border
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Disable the legend
      },
      tooltip: {
        enabled: false, // Disable the tooltip
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className={styles.chartContainer}>
      <p style={{ textAlign: 'center', color: 'rgba(204, 116, 0, 0.8)' }}>Last 30 Days</p>
      <div className={styles.chartWrapper}>
        <Line data={chartData} options={options} plugins={[shadowPlugin]} />
      </div>
    </div>
  );
};

export default BitcoinChart;