import {ReactNode} from "react"
import { ApolloWrapper } from "../lib/apollo-provider";
import {SignerProvider} from "../state/signer";
import { SessionProvider } from "next-auth/react";
require('dotenv').config();

type LayoutProps = {
  children: ReactNode;
};
export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="https://arells.com/ArellsIcoIcon.png" />
      </head>
      <body>
        <SignerProvider>
          <ApolloWrapper>
            <SessionProvider>
            {children}
            </SessionProvider>
          </ApolloWrapper>
        </SignerProvider>
      </body>
    </html>
  )
}
