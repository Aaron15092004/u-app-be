// EXPO GO MOCK — Apple Sign-In not available without native iOS build
// Restore real implementation before EAS/production build

export async function isAppleAuthAvailable(): Promise<boolean> {
  return false;
}

export async function signInWithApple(): Promise<{ identityToken: string; nonce?: string }> {
  throw new Error('Apple Sign-In không khả dụng trong Expo Go. Cần Development Build trên iOS.');
}
