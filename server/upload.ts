import ImageKit from 'imagekit';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Load environment variables for ImageKit
const imagekitPublicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
const imagekitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
const imagekitUrlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

export const useImageKit = !!(imagekitPublicKey && imagekitPrivateKey && imagekitUrlEndpoint);

console.log(useImageKit 
  ? '📸 Storage: ImageKit cloud integration is active.' 
  : '📂 Storage: ImageKit keys missing. Using local file storage fallback (/uploads).'
);

// Initialize ImageKit if keys are present
const imagekit = useImageKit
  ? new ImageKit({
      publicKey: imagekitPublicKey,
      privateKey: imagekitPrivateKey,
      urlEndpoint: imagekitUrlEndpoint,
    })
  : null;

// Local fallback directories
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const SUB_DIRS = ['profiles', 'thumbnails', 'videos'];

// Ensure uploads directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
SUB_DIRS.forEach(sub => {
  const dirPath = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Setup multer with memory storage so we have access to file buffer
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max for videos
  },
});

export interface UploadResult {
  url: string;
  fileId?: string;
  success: boolean;
}

/**
 * Uploads a file buffer either to ImageKit or to the local filesystem.
 */
export async function uploadToStorage(
  file: Express.Multer.File,
  folderName: 'profiles' | 'thumbnails' | 'videos'
): Promise<UploadResult> {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const cleanOriginalName = path.basename(file.originalname, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueFilename = `${cleanOriginalName}_${Date.now()}${fileExtension}`;

  if (useImageKit && imagekit) {
    try {
      console.log(`Uploading ${file.originalname} to ImageKit folder: ${folderName}...`);
      const base64File = file.buffer.toString('base64');
      const response = await imagekit.upload({
        file: base64File, // base64 string
        fileName: uniqueFilename,
        folder: `/tg_premium/${folderName}`,
        useUniqueFileName: true,
      });

      console.log(`ImageKit upload success: ${response.url}`);
      return {
        url: response.url,
        fileId: response.fileId,
        success: true,
      };
    } catch (error) {
      console.error('ImageKit upload error, falling back to local saving:', error);
      // Let it fall back to local if cloud upload fails
    }
  }

  // Local fallback implementation
  try {
    const destinationPath = path.join(UPLOADS_DIR, folderName, uniqueFilename);
    console.log(`Saving ${file.originalname} locally to: ${destinationPath}...`);
    
    fs.writeFileSync(destinationPath, file.buffer);
    
    // The client will access this via /uploads/folderName/uniqueFilename
    const localUrl = `/uploads/${folderName}/${uniqueFilename}`;
    console.log(`Local save success: ${localUrl}`);
    
    return {
      url: localUrl,
      success: true,
    };
  } catch (error) {
    console.error('Local save error:', error);
    return {
      url: '',
      success: false,
    };
  }
}
