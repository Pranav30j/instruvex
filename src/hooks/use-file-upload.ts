import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseFileUploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function useFileUpload({
  bucket = "academy-content",
  folder = "uploads",
  maxSizeMB = 100,
  acceptedTypes,
}: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File): Promise<string | null> => {
    if (acceptedTypes && !acceptedTypes.some((t) => file.type.startsWith(t))) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File exceeds ${maxSizeMB}MB limit`);
    }

    setUploading(true);
    setProgress(10);

    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    try {
      setProgress(30);
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;
      setProgress(90);

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      setProgress(100);
      return urlData.publicUrl;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return { upload, uploading, progress };
}
