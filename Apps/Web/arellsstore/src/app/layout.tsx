import {ReactNode} from "react"
import { ApolloWrapper } from "../lib/apollo-provider";
import {SignerProvider} from "../state/signer";
require('dotenv').config();
import dynamic from 'next/dynamic';

const ClientSideComponent = dynamic(
  () => import('./client-components/ClientSideComponent'),
  { ssr: false }
);

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
            <ClientSideComponent>
            {children}
            </ClientSideComponent>
          </ApolloWrapper>
        </SignerProvider>
      </body>
    </html>
  )
}
