export const metadata = {
    home: {
      robots: "noimageindex",
      charset: "UTF-8",
      title: "Arells",
      description: "Art Sells",
      google: "nositelinkssearchbox",
      keywords: "Arells",
      author: "Arells",
      viewport: "width=device-width,user-scalable=yes,initial-scale=1",
      canonical: "https://arells.com",
      og: {
          image: "https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
          site_name: "Arells",
          type: "object",
          title: "Arells",
          url: "https://arells.com",
          description: "Art Sells",
          imageType: "image/jpg",
          imageWidth: "700",
          imageHeight: "400",
      },
      twitter: {
          title: "Arells",
          image: "https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
          url: "https://arells.com",
          card: "summary_large_image",
          description: "Art Sells",
      }
    }
};
 
export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
