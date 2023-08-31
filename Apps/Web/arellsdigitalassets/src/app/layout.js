export const metadata = {
  robots: "noimageindex",
  httpEquiv: {
    "X-UA-Compatible": "IE=edge"
  },
  charSet: "UTF-8",
  title: {
    template: '%s',
  }, 
  description: {
    template: '%s',
  },
  google: "nositelinkssearchbox",
  keywords: "Arells",
  author: "Arells",
  viewport: {
    content: "width=device-width,user-scalable=yes,initial-scale=1",
    id: "viewport"
  },

  linkCanonical: {
    template: '%s',
  },

  og: {
    image:  {
      template: '%s',
    },
    site_name: {
      template: '%s',
    },
    type: {
      template: '%s',
    },
    title: {
      template: '%s',
    },
    url:  {
      template: '%s',
    },
    description:  {
      template: '%s',
    },
    imageType:  {
      template: '%s',
    },
    imageWidth:  {
      template: '%s',
    },
    imageHeight:  {
      template: '%s',
    },
  },


  twitter: {
    title:  {
      template: '%s',
    },
    image:  {
      template: '%s',
    },
    url:  {
      template: '%s',
    },
    card:  {
      template: '%s',
    },
    description:  {
      template: '%s',
    },
  }
};

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
