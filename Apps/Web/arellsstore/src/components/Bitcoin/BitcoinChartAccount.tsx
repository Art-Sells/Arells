import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import styles from '../../app/css/bitcoin/BitcoinChart.module.css';
import '../../app/css/bitcoin/bitcoinchart.css';

import type { ImageLoaderProps } from 'next/image';
import Image from 'next/image';

interface PricePoint {
  x: Date;
  y: number;
}

Chart.register(...registerables);

const customPlugin = {
  id: 'customPlugin',
  beforeDatasetsDraw: (chart: any) => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(204, 116, 0, 0.0)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
  },
  afterDatasetsDraw: (chart: any) => {
    const ctx = chart.ctx;
    ctx.restore();
  },
  beforeDatasetDraw: (chart: any, args: any) => {
    const { ctx } = chart;
    ctx.lineCap = 'round';
  },
};

const fetchHistoricalData = async (): Promise<PricePoint[]> => {
  const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365');
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
  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };

  const [chartData, setChartData] = useState<ChartData<'line', PricePoint[]>>({
    datasets: [],
  });
  const [percentageIncrease, setPercentageIncrease] = useState<number | null>(null);
  const [minDate, setMinDate] = useState<number | undefined>(undefined);
  const [maxDate, setMaxDate] = useState<number | undefined>(undefined);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const updateChartData = async () => {
      try {
        const historicalPrices = await fetchHistoricalData();
        const latestPrice = await fetchLatestPrice();

        const latestDate = new Date();
        let allPrices = [...historicalPrices, latestPrice];

        let filteredPrices = filterPriceData(allPrices);

        const lastValidPrice = filteredPrices[filteredPrices.length - 1]?.y;
        if (latestPrice.y < lastValidPrice) {
          filteredPrices.push({ x: latestDate, y: lastValidPrice });
        } else {
          filteredPrices.push({ x: latestDate, y: latestPrice.y });
        }

        const maxDate = latestDate.getTime();
        const minDate = new Date(maxDate - 364 * 24 * 60 * 60 * 1000).getTime();

        filteredPrices = filteredPrices.filter(price => price.x.getTime() >= minDate);

        setMinDate(minDate);
        setMaxDate(maxDate);

        const minPrice = Math.min(...filteredPrices.map(price => price.y));
        const maxPrice = Math.max(...filteredPrices.map(price => price.y));

        const percentageIncrease = ((maxPrice - minPrice) / minPrice) * 100;

        setPercentageIncrease(percentageIncrease);

        setChartData({
          datasets: [{
            label: 'Bitcoin',
            data: filteredPrices,
            borderColor: 'rgb(248, 141, 0, 1)',
            backgroundColor: 'rgba(75,192,192, 1)',
            pointRadius: 0,
            pointHoverRadius: 0,
            pointBorderWidth: 1.5,
            cubicInterpolationMode: 'monotone',
            tension: 0.4,
            fill: false,
            borderWidth: 1,
          }]
        });
        setError(false); // Reset error state if successful
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(true); // Set error state if there's an error
      }
    };

    updateChartData();
    const intervalId = setInterval(updateChartData, 60000);

    return () => clearInterval(intervalId);
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
          display: false,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        min: minDate,
        max: maxDate,
      },
      y: {
        beginAtZero: false,
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className={styles.chartContainerAccount}>
      <div id="b-logo-home">
        <span>
          <div id="a-how-wrapper">
            <Image
              loader={imageLoader}
              alt=""
              width={30}
              height={30}
              id="arells-b-home"
              src="images/howitworks/ArellsBitcoin.png"
            />
          </div>
        </span>
        <span>
          <div id="b-how-wrapper">
            <Image
              loader={imageLoader}
              alt=""
              width={30}
              height={30}
              id="bitcoin-b-home-account"
              src="images/howitworks/Bitcoin.png"
            />
          </div>
        </span>
      </div>
      <div id="spacer-if-error" style={{ display: percentageIncrease === null ? 'block' : 'none' }}>
      </div>
      <div className={styles.percentageContainer}>
        {percentageIncrease !== null && (
          <div className={styles.percentageLabel}>
            <span id="plus-home">+</span>
            <span>
              {`${percentageIncrease.toFixed(2)}`}
            </span>
            <span id="percentage-home">%</span>
          </div>
        )}
      </div>
      <div id="w-how-wrapper">
        <Image
          loader={imageLoader}
          alt=""
          width={35}
          height={35}
          id="profits-icon-home-account"
          src="images/howitworks/up-arrow-ebony.png"
        />
      </div>
      <p className={styles.lastThirtyDaysAccount}>1 YEAR</p>
      <div className={styles.lineChartWrapperAccount}>
        <Line
          id="bitcoinChart"
          className={styles.lineAccount}
          data={chartData}
          options={options}
          plugins={[customPlugin]}
        />
      </div>
    </div>
  );
};

export default BitcoinChart;