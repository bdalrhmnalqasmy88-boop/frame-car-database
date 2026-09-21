import { Platform } from 'react-native';

export async function uriToBase64(uri: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blobToBase64(blob);
    }
    const response = await fetch(uri);
    const blob = await response.blob();
    return blobToBase64(blob);
  } catch (e) {
    console.warn('uriToBase64 failed:', e);
    return null;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToDataUri(base64: string): string {
  if (base64.startsWith('data:')) return base64;
  return `data:image/jpeg;base64,${base64}`;
}

export function isDataUri(uri: string): boolean {
  return uri.startsWith('data:');
}

export function isHttpUrl(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}
