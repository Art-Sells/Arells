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
      <body>
        <SignerProvider>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </SignerProvider>
      </body>
    </html>
  )
}
