import { getSupabaseAdmin } from './admin';

export const DEFAULT_ASSET_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'cloudkitchen-assets';

export interface UploadOptions {
  bucket?: string;
  contentType?: string;
  upsert?: boolean;
}

/**
 * Upload a binary buffer or Blob to Supabase Storage bucket.
 * Returns public CDN URL on success.
 */
export async function uploadStoreFile(
  filePath: string,
  fileData: Buffer | Uint8Array | Blob,
  options?: UploadOptions
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    const bucket = options?.bucket || DEFAULT_ASSET_BUCKET;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, fileData, {
      contentType: options?.contentType || 'image/jpeg',
      upsert: options?.upsert ?? true,
    });

    if (uploadError) {
      console.error('[Supabase Storage] Upload error:', uploadError.message);
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      success: true,
      url: data.publicUrl,
    };
  } catch (err: any) {
    console.error('[Supabase Storage] Unexpected upload failure:', err);
    return { success: false, error: err?.message || 'Storage upload failed' };
  }
}

/**
 * Retrieve public URL for an asset in Supabase Storage.
 */
export function getStoreFileUrl(filePath: string, bucket: string = DEFAULT_ASSET_BUCKET): string {
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage bucket.
 */
export async function deleteStoreFile(
  filePath: string,
  bucket: string = DEFAULT_ASSET_BUCKET
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Storage delete failed' };
  }
}

/**
 * List files inside a directory of Supabase Storage bucket.
 */
export async function listStoreFiles(prefix = '', bucket: string = DEFAULT_ASSET_BUCKET) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    throw error;
  }
  return data;
}
