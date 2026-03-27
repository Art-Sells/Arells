 'use client';
 
 import { useEffect } from 'react';
 import { usePathname } from 'next/navigation';
 
const DEFAULT_FAVICON = '/ArellsIcoIcon.png';
const BITCOIN_FAVICON = '/images/assets/crypto/Bitcoin.svg';
const ETHEREUM_FAVICON = '/images/assets/crypto/Ethereum.svg';
const VAVITY_FAVICON = '/images/vavity/favicon.png';

const resolveFavicon = (pathname: string) => {
  if (pathname.startsWith('/bitcoin')) return BITCOIN_FAVICON;
  if (pathname.startsWith('/ethereum')) return ETHEREUM_FAVICON;
  if (pathname.startsWith('/vavity')) return VAVITY_FAVICON;
  return DEFAULT_FAVICON;
};
 
 const ensureLink = (rel: string, type?: string) => {
   let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
   if (!link) {
     link = document.createElement('link');
     link.rel = rel;
     document.head.appendChild(link);
   }
   if (type) link.type = type;
   return link;
 };
 
 export default function FaviconSwitcher() {
   const pathname = usePathname();
 
   useEffect(() => {
     if (typeof document === 'undefined') return;
     const href = resolveFavicon(pathname || '/');
     const type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
 
     ensureLink('icon', type).href = href;
     ensureLink('shortcut icon', type).href = href;
     ensureLink('apple-touch-icon').href = href;
   }, [pathname]);
 
   return null;
 }
