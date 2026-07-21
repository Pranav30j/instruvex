import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onFile: (f: File) => void;
  loading?: boolean;
}

export default function UploadDropzone({ onFile, loading }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError(null);
    if (rejected.length) {
      setError("Please upload a PDF or DOCX file under 10 MB.");
      return;
    }
    if (accepted[0]) onFile(accepted[0]);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: loading,
  });

  return (
    <div>
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card/40"
        } ${loading ? "opacity-70 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-foreground">
              {loading ? "Analyzing your resume…" : isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF or DOCX • Max 10 MB • Processed locally in your browser
            </p>
          </div>
          {!loading && (
            <button type="button" className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium">
              <FileText className="w-4 h-4" /> Choose File
            </button>
          )}
        </div>
      </motion.div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}