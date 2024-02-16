// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findUser, AppUser } from '../../../lib/auth-helpers'; // Update the path as necessary
import bcrypt from 'bcrypt';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error('Missing credentials');
        }

        const user = await findUser(credentials.email);
        if (!user) {
          throw new Error('No user found');
        }

        const isValid = bcrypt.compareSync(credentials.password, user.password || '');
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        // Omit the password before returning the user object
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin', // Customize sign-in page
  },
  // Add session and JWT configuration as needed
});
