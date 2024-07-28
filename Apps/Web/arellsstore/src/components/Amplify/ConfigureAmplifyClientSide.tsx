// components/ConfigureAmplifyClientSide.tsx
"use client";
import { Amplify } from 'aws-amplify';
import dotenv from 'dotenv';
import awsmobile from "../../aws-exports";

dotenv.config();
Amplify.configure(awsmobile);

export default function ConfigureAmplifyClientSide() {
    return null;
}
