// The CFS lead-servicing workflow — every new lead is serviced through this
// consistent lifecycle (Salesforce-style path). Stored on the opportunity as
// `workflow_stage`; 'won'/'lost' both map to the "Closed" node.

export type WorkflowStage =
  | 'lead_source'
  | 'lead'
  | 'qualification'
  | 'conversion'
  | 'opportunity'
  | 'won'
  | 'lost'
  | 'onboarding';

export interface PathNode {
  key: string;           // node key (path position)
  label: string;
  stages: WorkflowStage[]; // stored stages that resolve to this node
  guidance: { title: string; items: string[] };
}

// Ordered path nodes shown as chevrons.
export const PATH_NODES: PathNode[] = [
  {
    key: 'lead_source',
    label: 'Lead Source',
    stages: ['lead_source'],
    guidance: {
      title: 'Capture where this lead came from',
      items: [
        'Record the campaign or lead source (referral, website, hospital, attorney).',
        'Log the first point of contact as an activity.',
      ],
    },
  },
  {
    key: 'lead',
    label: 'Lead',
    stages: ['lead'],
    guidance: {
      title: 'Confirm the lead is real and de-duplicated',
      items: [
        'Capture identity and contact details on the CIF.',
        'Confirm this is not spam and de-duplicate against existing contacts.',
        'Assign an owner.',
      ],
    },
  },
  {
    key: 'qualification',
    label: 'Qualification',
    stages: ['qualification'],
    guidance: {
      title: 'Hold the interest meeting & qualify',
      items: [
        'Hold the interest meeting.',
        'Confirm the matter type and that CFS is a fit.',
        'Assess urgency and capacity.',
      ],
    },
  },
  {
    key: 'conversion',
    label: 'Conversion',
    stages: ['conversion'],
    guidance: {
      title: 'Hold intake & decide to convert',
      items: [
        'Hold the intake meeting.',
        'Begin the CIF in earnest.',
        'Decide to convert to a client engagement — creates Account + Contact + Opportunity.',
      ],
    },
  },
  {
    key: 'opportunity',
    label: 'Opportunity',
    stages: ['opportunity'],
    guidance: {
      title: 'Work the open engagement',
      items: [
        'Complete the CIF, EP documents, and agree the fee.',
        'Track completion items to the close.',
      ],
    },
  },
  {
    key: 'closed',
    label: 'Closed',
    stages: ['won', 'lost'],
    guidance: {
      title: 'Close the engagement',
      items: [
        'Closed Won: all completion items in — proceed to onboarding.',
        'Closed Lost: the prospect is not proceeding — record the reason.',
      ],
    },
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    stages: ['onboarding'],
    guidance: {
      title: 'Onboard the client',
      items: [
        'Execute the engagement contract.',
        'Begin ongoing managed fiduciary service.',
      ],
    },
  },
];

export function nodeIndexForStage(stage: WorkflowStage): number {
  const i = PATH_NODES.findIndex((n) => n.stages.includes(stage));
  return i < 0 ? 0 : i;
}

/** The stored stage that "advancing to" a given node should set. */
export function stageForNodeAdvance(nodeKey: string): WorkflowStage {
  switch (nodeKey) {
    case 'lead_source': return 'lead_source';
    case 'lead': return 'lead';
    case 'qualification': return 'qualification';
    case 'conversion': return 'conversion';
    case 'opportunity': return 'opportunity';
    case 'closed': return 'won';
    case 'onboarding': return 'onboarding';
    default: return 'lead_source';
  }
}

export const workflowStageLabel: Record<WorkflowStage, string> = {
  lead_source: 'Lead Source',
  lead: 'Lead',
  qualification: 'Qualification',
  conversion: 'Conversion',
  opportunity: 'Opportunity',
  won: 'Closed Won',
  lost: 'Closed Lost',
  onboarding: 'Onboarding',
};
