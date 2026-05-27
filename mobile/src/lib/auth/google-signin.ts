import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export { statusCodes };

// Configure once at module load — safe to call multiple times.
// webClientId must match the Web client ID in Google Cloud Console
// (same value the backend uses to verify idTokens).
GoogleSignin.configure({
  webClientId: '788882504008-5jp9p0njsl401qkqgn1fp7h597i25e6i.apps.googleusercontent.com',
  // TODO: add iosClientId once iOS OAuth client is created in Google Cloud Console
  // iosClientId: 'XXXX.apps.googleusercontent.com',
  offlineAccess: false,
});

export async function signInWithGoogle(): Promise<{ idToken: string }> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // v13 returns { type: 'success', data: { idToken, ... } }
  // older versions return { idToken, ... } directly — handle both
  const response = await GoogleSignin.signIn() as
    | { data?: { idToken?: string | null }; idToken?: string | null }
    | { type: 'cancelled' };

  if ('type' in response && response.type === 'cancelled') {
    const err = new Error('Đăng nhập Google đã bị hủy') as Error & { code: string };
    err.code = statusCodes.SIGN_IN_CANCELLED;
    throw err;
  }

  const r = response as { data?: { idToken?: string | null }; idToken?: string | null };
  const idToken = r.data?.idToken ?? r.idToken ?? null;

  if (!idToken) {
    throw new Error('Google Sign-In không trả về idToken. Vui lòng thử lại.');
  }

  return { idToken };
}

export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
  } catch {
    // ignore sign-out errors
  }
}
