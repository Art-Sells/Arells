import {ReactNode} from "react"
import { ApolloWrapper } from "../lib/apollo-provider";
import {SignerProvider} from "../state/signer";
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
        
        
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        
      </body>
    </html>
  )
}
