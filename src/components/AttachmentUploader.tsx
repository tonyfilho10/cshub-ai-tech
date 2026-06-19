"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteAttachment } from "@/lib/actions/demands";

export type UploadedAttachment = {
  id?: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

export function useAttachmentUpload() {
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);

    if (attachments.length + list.length > MAX_FILES) {
      setError(`Máximo de ${MAX_FILES} arquivos por envio.`);
      return;
    }
    const oversized = list.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`"${oversized.name}" excede o limite de 10MB.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded: UploadedAttachment[] = [];
      for (const file of list) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from("attachments").getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, fileName: file.name, fileType: file.type, fileSize: file.size });
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }

  function reset() {
    setAttachments([]);
    setError(null);
  }

  return { attachments, uploading, error, addFiles, removeAttachment, reset };
}

export function AttachmentPicker({
  onSelect,
  disabled,
  compact,
}: {
  onSelect: (files: FileList) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy-200 dark:border-navy-700 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-800/60 transition ${
        compact ? "p-2.5" : "px-2.5 py-1.5 text-xs"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <Paperclip size={compact ? 15 : 13} />
      {!compact && "Anexar"}
      <input
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.xml,.xls,.xlsx,.csv,.txt,.doc,.docx"
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onSelect(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function AttachmentChips({
  attachments,
  onRemove,
  uploading,
}: {
  attachments: UploadedAttachment[];
  onRemove?: (url: string) => void;
  uploading?: boolean;
}) {
  if (attachments.length === 0 && !uploading) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {attachments.map((a) => (
        <span
          key={a.url}
          className="flex items-center gap-1 rounded-lg border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800/50 px-2 py-1 text-xs text-navy-700 dark:text-navy-300"
        >
          {a.fileType.startsWith("image/") ? <ImageIcon size={12} /> : <FileText size={12} />}
          <span className="max-w-[140px] truncate">{a.fileName}</span>
          {onRemove && (
            <button type="button" onClick={() => onRemove(a.url)} className="text-navy-400 hover:text-red-600">
              <X size={11} />
            </button>
          )}
        </span>
      ))}
      {uploading && (
        <span className="flex items-center gap-1 rounded-lg border border-navy-200 dark:border-navy-700 px-2 py-1 text-xs text-navy-400">
          <Loader2 size={12} className="animate-spin" />
          Enviando...
        </span>
      )}
    </div>
  );
}

export function AttachmentGallery({
  attachments,
  canDelete,
}: {
  attachments: UploadedAttachment[];
  canDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (attachments.length === 0) return null;

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAttachment(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {attachments.map((a) => (
        <span
          key={a.url}
          className="flex items-center gap-1 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900/40 px-2 py-1 text-xs text-navy-600 dark:text-navy-300"
        >
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-accent-600 transition"
          >
            {a.fileType.startsWith("image/") ? <ImageIcon size={12} /> : <FileText size={12} />}
            <span className="max-w-[160px] truncate">{a.fileName}</span>
          </a>
          {canDelete && a.id && (
            <button
              type="button"
              disabled={pending}
              onClick={() => handleDelete(a.id!)}
              className="text-navy-400 hover:text-red-600 disabled:opacity-40"
              aria-label="Excluir anexo"
            >
              <X size={11} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
