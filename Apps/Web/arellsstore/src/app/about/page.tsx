import React from 'react';
import Link from 'next/link';

const AboutPage = () => {
  return (
    <div style={{ padding: '32px', color: '#222' }}>
      <p>Arells is a ledger that shows how your investments would look if bear markets never existed.</p>
      <p>
        Powered by{' '}
        <Link href="https://vavity.com">
          <button type="button">(Vavity (V))</button>
        </Link>
      </p>
    </div>
  );
};

export default AboutPage;
