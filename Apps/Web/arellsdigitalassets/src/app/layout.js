export const metadata = {
  title: 'Arells',
  description: 'An NFT store that financially empowers artists.',
}
 
export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
