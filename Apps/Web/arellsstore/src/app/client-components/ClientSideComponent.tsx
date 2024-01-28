// client-components/ClientSideComponent.tsx
import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

type ClientSideComponentProps = {
  children: ReactNode;
};

const ClientSideComponent: React.FC<ClientSideComponentProps> = ({ children }) => (
  <SessionProvider>
    {children}
  </SessionProvider>
);

export default ClientSideComponent;
