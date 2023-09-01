
export const metadata = {
    //change below link after test
    metadataBase: new URL('https://jeremyakatsa.com/'),
};

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
