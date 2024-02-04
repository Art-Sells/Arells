import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
//import { findUser, createUser } from '../store-brand-database';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google client ID and secret must be defined');
}

export default NextAuth({
    providers: [
        GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        // async signIn({ user, account, profile }) {
        //     const existingUser = await findUser(user.email);
        //     if (existingUser) {
        //         return true;
        //     } else {
        //         const newUser = await createUser({ email: user.email });
        //         return newUser ? true : false;
        //     }
        // },
    },
});

