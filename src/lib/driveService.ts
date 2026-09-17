import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive Scopes
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Persistent listeners
const listeners = new Set<(user: User | null, token: string | null) => void>();

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
  listeners.forEach(cb => cb(user, cachedAccessToken));
});

export const subscribeAuth = (cb: (user: User | null, token: string | null) => void) => {
  listeners.add(cb);
  // Execute immediately with current values
  cb(auth.currentUser, cachedAccessToken);
  return () => {
    listeners.delete(cb);
  };
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    // Notify
    listeners.forEach(cb => cb(result.user, cachedAccessToken));
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  listeners.forEach(cb => cb(null, null));
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Interface for Google Drive file metadata
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

// List 3MF and custom project files from user's Google Drive
export const listDriveFiles = async (accessToken: string): Promise<DriveFile[]> => {
  try {
    const query = encodeURIComponent("name contains '.3mf' or mimeType = 'application/json' or name contains 'chop_'");
    const fields = 'files(id,name,mimeType,modifiedTime,size,webViewLink,thumbnailLink)';
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error de Google Drive API: ${res.statusText} (${errText})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('listDriveFiles error:', err);
    throw err;
  }
};

// Create/Upload a file to Google Drive
export const uploadFileToDrive = async (
  accessToken: string,
  filename: string,
  content: Blob,
  mimeType: string = 'application/octet-stream'
): Promise<DriveFile> => {
  try {
    // 1. Metadata part
    const metadata = {
      name: filename,
      mimeType: mimeType
    };

    // 2. Multi-part upload request
    const boundary = 'foo_bar_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(content);
    });

    const base64Content = await base64Promise;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      base64Content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error al subir archivo a Drive: ${errText}`);
    }

    const data = await res.json();
    return data as DriveFile;
  } catch (err) {
    console.error('uploadFileToDrive error:', err);
    throw err;
  }
};
