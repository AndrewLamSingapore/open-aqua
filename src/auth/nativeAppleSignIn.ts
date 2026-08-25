import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { AppleSignInPort } from './appleSignIn';

export const nativeAppleSignIn: AppleSignInPort = {
  createRandomValue: () => Crypto.randomUUID(),
  hashNonce: (rawNonce) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce),
  requestCredential: (nonce, state) => AppleAuthentication.signInAsync({
    nonce,
    state,
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL
    ]
  })
};
