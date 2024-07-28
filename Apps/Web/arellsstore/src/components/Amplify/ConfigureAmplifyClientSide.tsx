// components/ConfigureAmplifyClientSide.tsx
"use client";
import { Amplify } from 'aws-amplify';
import awsmobile from '../../aws-exports';
import dotenv from 'dotenv';

dotenv.config();
Amplify.configure(awsmobile);

export default function ConfigureAmplifyClientSide() {
    return null;
}
