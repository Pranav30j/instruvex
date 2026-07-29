import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface Props {
  onFile: (f: File) => void;
  loading?: boolean;
}

export default function UploadDropzone({ onFile, loading }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError(null);
    try {
      if (rejected?.length) {
        const code = rejected[0]?.errors?.[0]?.code;
        setError(
          code === "file-too-large"
            ? "That file is larger than 10 MB. Please upload a smaller resume."
            : "Please upload a PDF or DOCX resume under 10 MB."
        );
        return;
      }
      const file = accepted?.[0];
      if (!file) {
        setError("No file was received. Please try selecting the file again.");
        return;
      }
      if (typeof file.size === "number" && file.size === 0) {
        setError("That file appears to be empty. Please choose another file.");
        return;
      }
      onFile(file);
    } catch (e) {
      setError((e as Error)?.message || "Something went wrong reading that file.");
    }
  }, [onFile]);

  // Mobile browsers frequently report an empty or generic MIME type, so we
  // validate by extension too and do real content sniffing during parsing.
  const validator = (file: File) => {
    const name = (file?.name || "").toLowerCase();
    const type = (file?.type || "").toLowerCase();
    const ok =
      name.endsWith(".pdf") ||
      name.endsWith(".docx") ||
      type === "application/pdf" ||
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      type === "application/octet-stream" ||
      type === "";
    return ok ? null : { code: "file-invalid-type", message: "Only PDF or DOCX files are supported." };
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    validator,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: loading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all hover:scale-[1.01] ${
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
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}