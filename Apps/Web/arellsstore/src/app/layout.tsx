import {ReactNode} from "react"
import { ApolloWrapper } from "../lib/apollo-provider";
import {SignerProvider} from "../state/signer";
require('dotenv').config();

import ConfigureAmplifyClientSide from "../components/Amplify/ConfigureAmplifyClientSide";
import { Amplify } from "aws-amplify";
import config from "../aws-exports";

Amplify.configure({ ...config }, { ssr: true });

type LayoutProps = {
  children: ReactNode;
};
export default function RootLayout({ 
  children 
}: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="https://arells.com/ArellsIcoIcon.png" />
      </head>
      <body>
          <ConfigureAmplifyClientSide />
          {children}
      </body>
    </html>
  )
}
