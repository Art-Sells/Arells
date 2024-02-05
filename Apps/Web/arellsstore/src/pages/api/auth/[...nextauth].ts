import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '../../../../firebaseConfig'; // Adjust the path as necessary
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

// Define the User interface
interface User {
  email: string;
  id?: string;
}

// Function to find a user
async function findUser(email: string): Promise<User | null> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  } else {
    const userDoc = querySnapshot.docs[0];
    return { email: userDoc.data().email, id: userDoc.id } as User;
  }
}

// Function to create a user
async function createUser({ email }: { email: string }): Promise<User> {
  const usersRef = collection(db, "users");
  const newUserRef = await addDoc(usersRef, { email });
  return { email, id: newUserRef.id };
}

// NextAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

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
        async signIn({ user }) {
            if (!user.email) {
                return false;
            }
    
            const existingUser = await findUser(user.email);
            if (existingUser) {
                return true; // User exists
            } else {
                const newUser = await createUser({ email: user.email });
                return newUser ? true : false; // New user created
            }
        },
    },
});
