'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

export default function Rules() {
  const [showModal, setShowModal] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [iconClosing, setIconClosing] = useState(false)

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
    const iconFadeOutTimer = setTimeout(() => {
      setIconClosing(true)
    }, 500)

    const fadeOutTimer = setTimeout(() => {
      setIsClosing(true)
    }, 1000)

    const closeTimer = setTimeout(() => {
      setShowModal(false)
    }, 2000)

    return () => {
      clearTimeout(iconFadeOutTimer)
      clearTimeout(fadeOutTimer)
      clearTimeout(closeTimer)
    }
  }, [])

  return (
    <main className={styles.main}>
      {showModal && (
        <div className={`${styles.modal} ${isClosing ? styles.modalClosing : ''}`}>
          <div className={styles.modalContent}>
            <Image
              src="/images/vavity/Vavity-Icon-Ivory.png"
              alt="Vavity Icon"
              width={40}
              height={40}
              className={`${styles.modalIcon} ${iconClosing ? styles.modalIconClosing : ''}`}
            />
          </div>
        </div>
      )}
      <div className={styles.container}>
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
          <h1 className={styles.title}>Rules</h1>
          
          <p className={styles.paragraph}>
            The autonomous system handles the rules, not humans.
          </p>
          
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Autonomous Protections</h2>
            
            <p className={styles.paragraph}>
              Humans don&apos;t control the environment, alter the system, or introduce volatility, so panic doesn&apos;t affect others.
            </p>
            
            <p className={styles.paragraph}>
              Once inside, the system protects humans from their own worst instincts by removing:
            </p>
            
            <ul className={styles.bulletList}>
              <li>loss realization</li>
              <li>fight-or-flight pressures</li>
            </ul>
            
            <p className={styles.paragraph}>This makes Vavity:</p>
            
            <ul className={styles.bulletList}>
              <li>non-manipulable</li>
              <li>non-inflationary</li>
              <li>non-extractive</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Anchored Upward Limit</h2>
            
            <p className={styles.paragraph}>prevents:</p>
            
            <ul className={styles.bulletList}>
              <li>price hyperinflation</li>
              <li>runaway psychological valuation</li>
              <li>unbounded optimism or mania</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Self-Limiting</h2>
            
            <ul className={styles.bulletList}>
              <li>Price cannot exceed external reference</li>
              <li>Price cannot fall below imports/purchases</li>
              <li>There is no mechanic that encourages runaway behavior (price hyper-inflation)</li>
            </ul>
          </section>
          
          <section className={styles.section}>
            <h2 className={`${styles.sectionTitle} ${styles.longTitle}`}>Why Previous Bear Market Obfuscating Financial Architectures Failed</h2>
            
            <p className={styles.paragraph}>
              Every failed monetary invention created to eliminate (or limit) investment losses was human dependent:
            </p>
            
            <ul className={styles.bulletList}>
              <li>human trust → issuance → risk</li>
              <li>human hype → exposure → greater collapse potential</li>
            </ul>
            
            <p className={styles.paragraph}>Vavity is:</p>
            
            <ul className={styles.bulletList}>
              <li><strong>autonomous</strong>: technology enforces the rules, not human judgment</li>
              <li><strong>bounded</strong>: prices cannot exceed external reference or fall below imports</li>
              <li><strong>self-limiting</strong>: no endogenous loops that spiral out of control</li>
              <li><strong>non-manipulable</strong>: irrational behavior cannot damage the architecture</li>
            </ul>
          </section>
        </div>
        
        <div className={styles.actions}>
          <Link href="/vavity/terminologies" className={styles.githubLink}>
            View Terminologies
          </Link>

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
