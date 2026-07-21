'use client';

/**
 * Upload + file list for any record, backed by /api/collections/attachments.
 *
 * Downloads use the short-lived signed URLs the API mints per request — the
 * bucket is private, so there is no permanent object URL to link to.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, FileText, Trash2, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Attachment {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  url?: string;
}

function formatBytes(n: number | null): string {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsPanel({
  entityType,
  entityId,
  canUpload = true,
  canDelete = true,
}: {
  entityType: string;
  entityId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/collections/attachments?entityType=${entityType}&entityId=${entityId}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load files.');
      setFiles(Array.isArray(data.attachments) ? data.attachments : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) return;
      setUploading(true);
      setError('');
      try {
        // Sequential, so one rejected file does not obscure the others.
        for (const file of Array.from(list)) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('entityType', entityType);
          fd.append('entityId', entityId);
          const res = await fetch('/api/collections/attachments', { method: 'POST', body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(`${file.name}: ${data.error || 'Upload failed.'}`);
        }
        await load();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [entityType, entityId, load],
  );

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/collections/attachments?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not delete the file.');
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      {canUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            upload(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-brand/50 hover:bg-secondary/30',
            dragOver && 'border-brand bg-brand/5',
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-brand" />
          ) : (
            <Upload className="size-5 text-muted-foreground" />
          )}
          <p className="text-sm text-foreground">
            {uploading ? 'Uploading…' : 'Drop files here, or click to choose'}
          </p>
          <p className="text-xs text-muted-foreground">Up to 25 MB each</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => upload(e.target.files)}
          />
        </div>
      )}

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {loading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Loading files…</p>
      ) : files.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No files yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{f.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(f.sizeBytes)}
                  {f.sizeBytes ? ' · ' : ''}
                  {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="Download"
                >
                  <Download className="size-4" />
                </a>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete file"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
