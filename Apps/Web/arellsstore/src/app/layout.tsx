import {ReactNode} from "react"
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import {SignerProvider} from "../state/signer";

type LayoutProps = {
  children: ReactNode;
};
export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <SignerProvider>
          {children}
        </SignerProvider>
      </body>
    </html>
  )
}
