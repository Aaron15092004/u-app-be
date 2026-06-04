import * as AppleAuthentication from 'expo-apple-authentication';

export async function isAppleAuthAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<{
  identityToken: string;
  nonce?: string;
  fullName?: string;
}> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple Sign-In không trả về identityToken. Vui lòng thử lại.');
  }

  const fullName = [
    credential.fullName?.givenName,
    credential.fullName?.middleName,
    credential.fullName?.familyName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    identityToken: credential.identityToken,
    fullName: fullName.length > 0 ? fullName : undefined,
  };
}
