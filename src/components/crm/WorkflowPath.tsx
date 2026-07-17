'use client';

import { Check, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PATH_NODES,
  nodeIndexForStage,
  stageForNodeAdvance,
  type WorkflowStage,
} from './workflow-meta';

const NOTCH = 15; // px depth of chevron notch/point

/** The primary action(s) for the current workflow stage — rendered in the
 *  card header so it sits with the title. */
export function WorkflowActions({
  workflowStage,
  closedStatus,
  busy,
  onSet,
}: {
  workflowStage: WorkflowStage;
  closedStatus: string | null;
  busy: boolean;
  onSet: (stage: WorkflowStage) => void;
}) {
  const currentIdx = nodeIndexForStage(workflowStage);
  const isLost = workflowStage === 'lost' || closedStatus === 'lost';
  const current = PATH_NODES[currentIdx];
  const nextNode = currentIdx < PATH_NODES.length - 1 ? PATH_NODES[currentIdx + 1] : null;

  if (current.key === 'opportunity') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onSet('won')} disabled={busy}>
          <CheckCircle2 className="size-4" /> Closed Won
        </Button>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onSet('lost')} disabled={busy}>
          <XCircle className="size-4" /> Closed Lost
        </Button>
      </div>
    );
  }
  if (current.key === 'closed') {
    return isLost ? (
      <Button size="sm" variant="outline" onClick={() => onSet('opportunity')} disabled={busy}>
        Reopen opportunity
      </Button>
    ) : (
      <Button size="sm" onClick={() => onSet('onboarding')} disabled={busy}>
        Begin onboarding <ArrowRight className="size-4" />
      </Button>
    );
  }
  if (nextNode) {
    return (
      <Button size="sm" onClick={() => onSet(stageForNodeAdvance(nextNode.key))} disabled={busy}>
        <Check className="size-4" /> Mark complete
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="size-4" /> Active client
    </span>
  );
}

export function WorkflowPath({
  workflowStage,
  closedStatus,
}: {
  workflowStage: WorkflowStage;
  closedStatus: string | null;
}) {
  const currentIdx = nodeIndexForStage(workflowStage);
  const isLost = workflowStage === 'lost' || closedStatus === 'lost';
  const closedIdx = PATH_NODES.findIndex((n) => n.key === 'closed');
  const current = PATH_NODES[currentIdx];

  return (
    <div>
      {/* Chevron path */}
      <div className="flex w-full overflow-x-auto pb-1">
        <div className="flex min-w-max">
          {PATH_NODES.map((node, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            const lostHere = isLost && i === closedIdx;
            const first = i === 0;
            const last = i === PATH_NODES.length - 1;

            const clip = first
              ? `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%)`
              : last
                ? `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${NOTCH}px 50%)`
                : `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%, ${NOTCH}px 50%)`;

            return (
              <div
                key={node.key}
                title={node.label}
                style={{ clipPath: clip, marginRight: last ? 0 : -NOTCH + 2, zIndex: PATH_NODES.length - i }}
                className={cn(
                  'relative flex items-center gap-1.5 whitespace-nowrap py-2.5 pr-4 text-xs font-medium',
                  first ? 'pl-4' : 'pl-6',
                  lostHere
                    ? 'bg-destructive text-white'
                    : active
                      ? 'bg-brand text-brand-foreground'
                      : done
                        ? 'bg-brand/20 text-brand'
                        : 'bg-secondary text-muted-foreground',
                )}
              >
                {done && <Check className="size-3.5" />}
                {lostHere && <XCircle className="size-3.5" />}
                {node.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidance (full width) */}
      <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brass">
          <Sparkles className="size-3.5" /> Guidance for success
        </p>
        <p className="font-medium text-foreground">{current.guidance.title}</p>
        <ul className="mt-2 space-y-1.5">
          {current.guidance.items.map((it, k) => (
            <li key={k} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" />
              {it}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
