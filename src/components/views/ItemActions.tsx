'use client';

/**
 * Per-record action menu: edit, favorite, share, archive, delete.
 *
 * Generic so every view and every page uses the same one. Each action is
 * optional — a page that cannot delete simply omits onDelete and the entry
 * disappears rather than failing when clicked.
 */
import { useEffect, useRef, useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Star,
  Share2,
  Archive,
  ArchiveRestore,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ItemActionsProps {
  isFavorite?: boolean;
  isArchived?: boolean;
  onEdit?: () => void;
  onFavorite?: (next: boolean) => void;
  onShare?: () => void;
  onArchive?: (next: boolean) => void;
  onDelete?: () => void;
  onAttach?: () => void;
  /** Shown in the delete confirmation so it is obvious what is being destroyed. */
  label?: string;
  busy?: boolean;
}

export function ItemActions({
  isFavorite,
  isArchived,
  onEdit,
  onFavorite,
  onShare,
  onArchive,
  onDelete,
  onAttach,
  label,
  busy,
}: ItemActionsProps) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmingDelete(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setConfirmingDelete(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setConfirmingDelete(false);
  };

  const item =
    'flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-50';

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Record actions"
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-40 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {onEdit && (
            <button type="button" className={item} onClick={() => { close(); onEdit(); }}>
              <Pencil className="size-4 text-muted-foreground" /> Edit
            </button>
          )}

          {onFavorite && (
            <button
              type="button"
              className={item}
              onClick={() => { close(); onFavorite(!isFavorite); }}
            >
              <Star
                className={cn('size-4', isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')}
              />
              {isFavorite ? 'Remove favorite' : 'Favorite'}
            </button>
          )}

          {onAttach && (
            <button type="button" className={item} onClick={() => { close(); onAttach(); }}>
              <Paperclip className="size-4 text-muted-foreground" /> Files
            </button>
          )}

          {onShare && (
            <button type="button" className={item} onClick={() => { close(); onShare(); }}>
              <Share2 className="size-4 text-muted-foreground" /> Share
            </button>
          )}

          {onArchive && (
            <button
              type="button"
              className={item}
              onClick={() => { close(); onArchive(!isArchived); }}
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="size-4 text-muted-foreground" /> Restore
                </>
              ) : (
                <>
                  <Archive className="size-4 text-muted-foreground" /> Archive
                </>
              )}
            </button>
          )}

          {onDelete && (
            <div className="mt-1 border-t border-border pt-1">
              {confirmingDelete ? (
                // Deleting a court-supervised file is unrecoverable, so the
                // confirmation is inline and names the record.
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Permanently delete{label ? ` ${label}` : ' this record'}? Archiving is reversible;
                    this is not.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { close(); onDelete(); }}
                      className="rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={cn(item, 'text-destructive hover:bg-destructive/10')}
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="size-4" /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
