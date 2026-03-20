import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFileUpload } from "@/hooks/use-file-upload";
import { toast } from "@/hooks/use-toast";
import { Upload, Link, X, CheckCircle2 } from "lucide-react";

interface FileUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  accept?: string;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  placeholder?: string;
  allowUrl?: boolean;
}

export default function FileUploadField({
  label,
  value,
  onChange,
  folder,
  accept = "*/*",
  acceptedTypes,
  maxSizeMB = 100,
  placeholder = "Paste URL or upload file",
  allowUrl = true,
}: FileUploadFieldProps) {
  const [mode, setMode] = useState<"url" | "upload">(allowUrl ? "url" : "upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress } = useFileUpload({ folder, maxSizeMB, acceptedTypes });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await upload(file);
      if (url) onChange(url);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {allowUrl && (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "url" ? "secondary" : "ghost"}
              className="h-6 px-2 text-xs"
              onClick={() => setMode("url")}
            >
              <Link size={10} className="mr-1" /> URL
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "upload" ? "secondary" : "ghost"}
              className="h-6 px-2 text-xs"
              onClick={() => setMode("upload")}
            >
              <Upload size={10} className="mr-1" /> Upload
            </Button>
          </div>
        )}
      </div>

      {mode === "url" && allowUrl ? (
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={handleFile}
            className="hidden"
          />
          {value ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span className="flex-1 truncate text-foreground">{value.split("/").pop()}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onChange("")}
              >
                <X size={12} />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} className="mr-2" />
              {uploading ? "Uploading..." : "Choose file"}
            </Button>
          )}
          {uploading && <Progress value={progress} className="h-1.5" />}
        </div>
      )}
    </div>
  );
}
