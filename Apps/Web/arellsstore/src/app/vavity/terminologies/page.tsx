'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

export default function Terminologies() {
  const [contentFadeIn, setContentFadeIn] = useState(false)

  useEffect(() => {
    const bg = '#000000';
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyMargin = document.body.style.margin;
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.body.style.margin = '0';
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
      document.body.style.margin = prevBodyMargin;
    };
  }, [])

  useEffect(() => {
    let cancelled = false
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setContentFadeIn(true)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [])

  return (
    <main className={styles.main}>
      <div
        className={`${styles.container} ${styles.contentMountFade}${
          contentFadeIn ? ` ${styles.contentMountFadeVisible}` : ''
        }`}
      >
        <div className={styles.backLinkWrapper}>
          <Link href="/vavity" className={styles.backLink}>
            <Image
              src="/images/vavity/Vavity-Icon-Ivory.png"
              alt="Back to Home"
              width={60}
              height={60}
              className={styles.backIcon}
            />
          </Link>
        </div>
        
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Terminologies</h1>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>VAPA: Valued Asset Price Anchored</h2>
            <p className={styles.paragraph}>The highest valued asset price anchored.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Vatop: Value At Time Of Purchase</h2>
            <ul className={styles.bulletList}>
              <li><strong>cVatop</strong>: Corresponding Value At Time Of Purchase, or the value of the asset investment at the time of purchase.</li>
              <li><strong>cpVatop</strong>: Corresponding Price (Value At Time Of Purchase), or VAPA at the time of purchase.</li>
              <li><strong>cdVatop</strong>: Corresponding Difference (Value At Time Of Purchase), or the difference between cVact and cVatop: cdVatop = cVact - cVatop.</li>
              <li><strong>acVatop</strong>: All Corresponding Values At Time Of Purchase, or the combination of all the cVatops.</li>
              <li><strong>acdVatop</strong>: All Corresponding Differences (Value At Time Of Purchase), or the combination of all the cdVatops.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Vact: Value At Current Time</h2>
            <ul className={styles.bulletList}>
              <li><strong>cVact</strong>: Corresponding Value At Current Time, or the current value of the asset investment, which starts as cVatop and increases as cpVact grows. cVact = cVactTaa*cpVact.</li>
              <li><strong>cpVact</strong>: Corresponding Price (Value At Current Time), or the current price of the asset; begins as cpVatop and adjusts based on the highest asset price observed (VAPA).</li>
              <li><strong>cVactTaa</strong>: Corresponding Value At Current Time Token Amount of Asset, or the token amount of the asset available.</li>
              <li><strong>acVact</strong>: All Corresponding Values At Current Time, or the combination of all cVacts.</li>
              <li><strong>acVactTaa</strong>: All Corresponding Values At Current Time Token Amounts of Asset, or the combination of all cVactTaas.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Calculation Scenarios</h2>

            <h3 className={styles.scenarioTitle}>1. External asset price: $60,000</h3>
            <p className={styles.paragraph}><strong>Action:</strong> $500 worth of the external asset investment purchased.</p>
            <p className={styles.paragraph}>VAPA = $60,000.</p>
            <p className={styles.scenarioLabel}>Purchase 1</p>
            <ul className={styles.calcBulletList}>
              <li>cVatop = $500</li>
              <li>cpVatop = $60,000</li>
              <li>cVact = $500</li>
              <li>cpVact = $60,000</li>
              <li>cVactTaa = 0.00833 Tokens</li>
              <li>cdVatop = $0</li>
            </ul>
            <p className={styles.scenarioLabel}>Purchase Totals</p>
            <ul className={styles.calcBulletList}>
              <li>acVatop = $500</li>
              <li>acdVatop = $0</li>
              <li>acVact = $500</li>
              <li>acVactTaa = 0.00833</li>
            </ul>

            <h3 className={styles.scenarioTitle}>2. External asset price falls: $54,000</h3>
            <p className={styles.paragraph}><strong>Action:</strong> $600 worth of the external asset investment purchased.</p>
            <p className={styles.paragraph}>VAPA = $60,000.</p>
            <p className={styles.scenarioLabel}>Purchase 1</p>
            <ul className={styles.calcBulletList}>
              <li>cVatop = $1,166</li>
              <li>cpVatop = $60,000</li>
              <li>cVact = $1,166</li>
              <li>cpVact = $60,000</li>
              <li>cVactTaa = 0.01944</li>
              <li>cdVatop = $0</li>
            </ul>
            <p className={styles.scenarioLabel}>Purchase Totals</p>
            <ul className={styles.calcBulletList}>
              <li>acVatop = $1,166</li>
              <li>acdVatop = $0</li>
              <li>acVact = $1,166</li>
              <li>acVactTaa = 0.01944</li>
            </ul>

            <h3 className={styles.scenarioTitle}>3. External asset price rises: $65,000</h3>
            <p className={styles.paragraph}>VAPA = $65,000.</p>
            <p className={styles.scenarioLabel}>Purchase 1</p>
            <ul className={styles.calcBulletList}>
              <li>cVatop = $1,166</li>
              <li>cpVatop = $60,000</li>
              <li>cVact = $1,263</li>
              <li>cpVact = $65,000</li>
              <li>cVactTaa = 0.01944</li>
              <li>cdVatop = $97</li>
            </ul>
            <p className={styles.scenarioLabel}>Purchase Totals</p>
            <ul className={styles.calcBulletList}>
              <li>acVatop = $1,166</li>
              <li>acdVatop = $97</li>
              <li>acVact = $1,263</li>
              <li>acVactTaa = 0.01944</li>
            </ul>

            <h3 className={styles.scenarioTitle}>4. External asset price falls: $63,000</h3>
            <p className={styles.paragraph}>VAPA = $65,000.</p>
            <p className={styles.scenarioLabel}>Purchase 1</p>
            <ul className={styles.calcBulletList}>
              <li>cVatop = $1,166</li>
              <li>cpVatop = $60,000</li>
              <li>cVact = $1,263</li>
              <li>cpVact = $65,000</li>
              <li>cVactTaa = 0.01944</li>
              <li>cdVatop = $97</li>
            </ul>
            <p className={styles.scenarioLabel}>Purchase Totals</p>
            <ul className={styles.calcBulletList}>
              <li>acVatop = $1,166</li>
              <li>acdVatop = $97</li>
              <li>acVact = $1,263</li>
              <li>acVactTaa = 0.01944</li>
            </ul>

            <h3 className={styles.scenarioTitle}>5. External asset price falls: $50,000</h3>
            <p className={styles.paragraph}><strong>Action:</strong> $200 worth of the external asset investment purchased.</p>
            <p className={styles.paragraph}>VAPA = $65,000.</p>
            <p className={styles.scenarioLabel}>Purchase 1</p>
            <ul className={styles.calcBulletList}>
              <li>cVatop = $1,166</li>
              <li>cpVatop = $60,000</li>
              <li>cVact = $1,263</li>
              <li>cpVact = $65,000</li>
              <li>cVactTaa = 0.01944</li>
              <li>cdVatop = $97</li>
            </ul>
            <p className={styles.scenarioLabel}>Purchase 2</p>
            <ul className={styles.calcBulletList}>
              <li>cVatop = $260</li>
              <li>cpVatop = $65,000</li>
              <li>cVact = $260</li>
              <li>cpVact = $65,000</li>
              <li>cVactTaa = 0.004</li>
              <li>cdVatop = $0</li>
            </ul>
            <p className={styles.scenarioLabel}>Purchase Totals</p>
            <ul className={styles.calcBulletList}>
              <li>acVatop = $1,426 ($1,166 + $260)</li>
              <li>acdVatop = $97 ($97 + $0)</li>
              <li>acVact = $1,523 ($1,263 + $260)</li>
              <li>acVactTaa = 0.02344 (0.01944 + 0.004)</li>
            </ul>
          </section>
        </div>
        
        <div className={styles.actions}>
          <a
            href="https://github.com/Art-Sells/Vavity"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubIconLink}
          >
            <Image
              src="/images/vavity/icons/github.png"
              alt="GitHub"
              width={32}
              height={32}
            />
          </a>
        </div>
      </div>
    </main>
  )
}
