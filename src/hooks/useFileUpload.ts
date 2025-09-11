import { supabase } from "@/integrations/supabase/client";

interface UploadOptions {
  bucket: string;
  userId: string;
  file: File;
  fileName?: string;
}

export const useFileUpload = () => {
  const uploadFile = async ({ bucket, userId, file, fileName }: UploadOptions): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const finalFileName = fileName || `${userId}/file.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(finalFileName, file, { upsert: true });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(finalFileName);

    return data.publicUrl;
  };

  const uploadProfilePhoto = (userId: string, file: File) => 
    uploadFile({ 
      bucket: "profile-photos", 
      userId, 
      file, 
      fileName: `${userId}/profile.${file.name.split('.').pop()}` 
    });

  const uploadCertificate = (userId: string, file: File) => 
    uploadFile({ 
      bucket: "certificates", 
      userId, 
      file, 
      fileName: `${userId}/certificate.${file.name.split('.').pop()}` 
    });

  return {
    uploadFile,
    uploadProfilePhoto,
    uploadCertificate,
  };
};