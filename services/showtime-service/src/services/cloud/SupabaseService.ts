// src/services/supabaseService.ts
import { supabase } from '../../config/supabase.js';

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'files';

class SupabaseService {
  /**
   * Generate a signed upload URL for a file
   */
  async generatePresignedUrl(fileName: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(fileName, {upsert: true}); // 5 minutes

    if (error) {
      console.error('Failed to generate signed URL', error.message);
      return null;
    }
    return data?.signedUrl || null;
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);
    return data.publicUrl;
  }

  /**
   * Delete file from bucket
   */
  async deleteFile(key: string): Promise<void> {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([key]);
    if (error) {
      console.error('Failed to delete file', error.message);
    }
  }
}

export default new SupabaseService();
