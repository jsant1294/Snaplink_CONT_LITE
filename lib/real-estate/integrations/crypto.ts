import { decryptSecretValue, encryptSecretValue, safeHashValue, signOpaqueValue, verifyOpaqueValue } from "./crypto-runtime";
export const encryptSecret = (plaintext:string,key:string):string => encryptSecretValue(plaintext,key);
export const decryptSecret = (envelope:string,key:string):string => decryptSecretValue(envelope,key);
export const signOpaque = (value:string,key:string):string => signOpaqueValue(value,key);
export const verifyOpaque = (signed:string,key:string):string|null => verifyOpaqueValue(signed,key);
export const safeHash = (value:string):string => safeHashValue(value);
