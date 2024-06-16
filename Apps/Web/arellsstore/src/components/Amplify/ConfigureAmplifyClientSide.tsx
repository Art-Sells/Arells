// components/ConfigureAmplifyClientSide.tsx
"use client";
import { Amplify } from 'aws-amplify';
import config from "../../aws-exports";

Amplify.configure({ ...config });

export default function ConfigureAmplifyClientSide() {
    return null;
}