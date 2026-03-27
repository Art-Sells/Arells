'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from './page.module.css'

export default function VavityHome() {
  const [showModal, setShowModal] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [iconClosing, setIconClosing] = useState(false)

  useEffect(() => {
    const bg = '#000000';
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
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
    <div className={styles.page}>
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
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.logoPlaceholder}>
            <Image
              src="/images/vavity/Vavity-Icon-Ivory.png"
              alt="Vavity Icon"
              width={60}
              height={60}
              className={styles.logoImage}
            />
          </div>
          
          <h1 className={styles.title}>VAVITY</h1>
          
          <div className={styles.contentSection}>
            <p className={styles.description}>
            An autonomous pricing system that anchors asset prices before they fall.
            </p>
            
            <div className={styles.marketplaceContent}>
              <p className={styles.psychologyText}>
                By eliminating value loss, Vavity introduces a new kind of marketplace and market dynamics:
              </p>
              
              <div className={styles.marketplaceSection}>
                <div className={styles.logoPlaceholder}>
                  <Image
                    src="/images/vavity/SolidMarket.png"
                    alt="Solid Marketplace Logo"
                    width={60}
                    height={60}
                    className={styles.solidMarketplaceLogo}
                  />
                </div>
                <div className={styles.marketplaceItemContainer}>
                  <p className={styles.marketplaceLabel}>
                    <strong>Solid Marketplace:</strong>
                  </p>
                  <p className={styles.psychologyText}>
                    a marketplace in which investments either stagnate or increase.
                  </p>
                </div>
              </div>
              
              <div className={styles.marketplaceSection}>
                <div className={styles.logoPlaceholder}>
                  <Image
                    src="/images/vavity/Sloth.png"
                    alt="Sloth Market Logo"
                    width={40}
                    height={40}
                    className={styles.slothMarketplaceLogo}
                  />
                </div>
                <div className={styles.marketplaceItemContainer}>
                  <p className={styles.marketplaceLabel}>
                    <strong>Sloth Market:</strong>
                  </p>
                  <p className={styles.psychologyText}>
                    a market in which investments stagnate.
                  </p>
                </div>
              </div>

              <p className={styles.psychologyText}>
                Just like the invention of clocks and calendars, Vavity is both a psychological and technological invention.
              </p>
            </div>
          </div>
          
          <div className={styles.actions}>
            <Link href="/vavity/rules" className={styles.readMoreButton}>
              View Rules
            </Link>

            <Link href="/vavity/terminologies" className={styles.githubLink}>
              View Terminologies
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
