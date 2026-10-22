/**
 * SAMPLE DATA for the gallery only. A fictional business ("Harbour Street Studio")
 * running an AI OS. Nothing here is real or measured; the gallery labels every
 * surface "Sample data". Dates are fixed ISO strings so server and client renders
 * match.
 *
 * Unknown values are deliberately included as `null` so every variant shows how it
 * renders "not measured" (see registry/latent/lib/values.tsx).
 */

import type { ValueUnit } from "@/registry/latent/lib/values"

export const SAMPLE_NOW = "2026-09-25T09:30:00+10:00"

export type SampleStat = {
  readonly id: string
  readonly label: string
  readonly value: number | null
  readonly previous: number | null
  readonly unit: ValueUnit
  /** The period the value covers, e.g. "Sep 2026". */
  readonly period: string
  /** The period `previous` covers, named in full for delta labels: "Aug 2026", "prior 7 days". */
  readonly comparison: string
  /** Oldest first. Null points are gaps, not zeros. */
  readonly series: readonly (number | null)[]
  /** For "higher is worse" measures such as cost or failures. */
  readonly invert?: boolean
  readonly target?: number
  readonly footnote?: string
}

export const SAMPLE_STATS: readonly SampleStat[] = [
  {
    id: "revenue",
    label: "Revenue",
    value: 48250,
    previous: 43100,
    unit: "currency",
    period: "Sep 2026",
    comparison: "Aug 2026",
    series: [31200, 33800, 35100, 38900, 41200, 43100, 48250],
    target: 50000,
  },
  {
    id: "active-clients",
    label: "Active clients",
    value: 37,
    previous: 37,
    unit: "count",
    period: "Sep 2026",
    comparison: "Aug 2026",
    series: [29, 31, 32, 34, 36, 37, 37],
  },
  {
    id: "agent-cost",
    label: "Agent spend",
    value: 612.4,
    previous: 540.1,
    unit: "currency",
    period: "Sep 2026",
    comparison: "Aug 2026",
    series: [410, 455, 470, 502, 530, 540.1, 612.4],
    invert: true,
    footnote: "Model usage across all agents",
  },
  {
    id: "approval-rate",
    label: "Drafts approved first time",
    value: 0.82,
    previous: 0.76,
    unit: "percent",
    period: "Last 30 days",
    comparison: "prior 30 days",
    series: [0.68, 0.7, null, 0.74, 0.76, 0.79, 0.82],
  },
  {
    id: "response-time",
    label: "Median reply time",
    value: 94000,
    previous: 131000,
    unit: "duration-ms",
    period: "Last 7 days",
    comparison: "prior 7 days",
    series: [180000, 162000, 150000, 131000, 120000, 101000, 94000],
    invert: true,
  },
  {
    id: "nps",
    label: "Client NPS",
    value: null,
    previous: null,
    unit: "count",
    period: "Sep 2026",
    comparison: "Aug 2026",
    series: [],
    footnote: "Survey not connected yet",
  },
]

export type ClientStatus = "active" | "onboarding" | "paused" | "churned"

export type SampleClient = {
  readonly id: string
  readonly name: string
  readonly industry: string
  readonly status: ClientStatus
  readonly owner: { readonly name: string; readonly initials: string }
  /** Monthly recurring revenue in AUD. Null when billing is not set up. */
  readonly mrr: number | null
  readonly agents: number
  readonly lastActivity: string
}

export const SAMPLE_CLIENTS: readonly SampleClient[] = [
  { id: "c1", name: "Northside Physio", industry: "Allied health", status: "active", owner: { name: "Ava Chen", initials: "AC" }, mrr: 2400, agents: 3, lastActivity: "2026-09-25T08:12:00+10:00" },
  { id: "c2", name: "Lumen Accounting", industry: "Accounting", status: "active", owner: { name: "Sam Patel", initials: "SP" }, mrr: 3850, agents: 5, lastActivity: "2026-09-25T07:40:00+10:00" },
  { id: "c3", name: "Bay Grammar", industry: "Education", status: "onboarding", owner: { name: "Ava Chen", initials: "AC" }, mrr: null, agents: 1, lastActivity: "2026-09-24T16:05:00+10:00" },
  { id: "c4", name: "Coastline Recruitment", industry: "Recruitment", status: "active", owner: { name: "Jordan Lee", initials: "JL" }, mrr: 1900, agents: 2, lastActivity: "2026-09-24T11:22:00+10:00" },
  { id: "c5", name: "Fernhill Vets", industry: "Veterinary", status: "paused", owner: { name: "Sam Patel", initials: "SP" }, mrr: 1200, agents: 1, lastActivity: "2026-09-18T09:00:00+10:00" },
  { id: "c6", name: "Kestrel Logistics", industry: "Logistics", status: "active", owner: { name: "Jordan Lee", initials: "JL" }, mrr: 5200, agents: 6, lastActivity: "2026-09-25T06:55:00+10:00" },
  { id: "c7", name: "Marlow Legal", industry: "Legal", status: "churned", owner: { name: "Ava Chen", initials: "AC" }, mrr: 0, agents: 0, lastActivity: "2026-08-30T15:10:00+10:00" },
  { id: "c8", name: "Tidewater Dental", industry: "Dental", status: "onboarding", owner: { name: "Jordan Lee", initials: "JL" }, mrr: 1650, agents: 2, lastActivity: "2026-09-23T13:45:00+10:00" },
]

export type RunStatus = "succeeded" | "running" | "failed" | "awaiting-approval"

export type SampleRun = {
  readonly id: string
  readonly agent: string
  readonly task: string
  readonly client: string
  readonly status: RunStatus
  readonly startedAt: string
  /** Null while running or when the run did not report timing. */
  readonly durationMs: number | null
  /** AUD. Null when the provider did not report usage. */
  readonly cost: number | null
}

export const SAMPLE_RUNS: readonly SampleRun[] = [
  { id: "r-1041", agent: "Inbox triage", task: "Sort 42 new emails", client: "Lumen Accounting", status: "succeeded", startedAt: "2026-09-25T09:02:00+10:00", durationMs: 48200, cost: 0.41 },
  { id: "r-1040", agent: "Invoice chaser", task: "Draft 6 overdue reminders", client: "Kestrel Logistics", status: "awaiting-approval", startedAt: "2026-09-25T08:47:00+10:00", durationMs: 31500, cost: 0.22 },
  { id: "r-1039", agent: "Report builder", task: "Weekly KPI pack", client: "Northside Physio", status: "running", startedAt: "2026-09-25T08:40:00+10:00", durationMs: null, cost: null },
  { id: "r-1038", agent: "Lead enricher", task: "Enrich 18 new leads", client: "Coastline Recruitment", status: "failed", startedAt: "2026-09-25T08:15:00+10:00", durationMs: 12900, cost: 0.08 },
  { id: "r-1037", agent: "Inbox triage", task: "Sort 17 new emails", client: "Northside Physio", status: "succeeded", startedAt: "2026-09-25T07:58:00+10:00", durationMs: 22100, cost: 0.19 },
  { id: "r-1036", agent: "Reconciler", task: "Match 212 bank lines", client: "Lumen Accounting", status: "succeeded", startedAt: "2026-09-25T07:30:00+10:00", durationMs: 184000, cost: 1.37 },
  { id: "r-1035", agent: "Report builder", task: "Enrolment summary", client: "Bay Grammar", status: "succeeded", startedAt: "2026-09-24T17:10:00+10:00", durationMs: 66400, cost: null },
]

export type SampleActivity = {
  readonly id: string
  readonly actor: { readonly name: string; readonly kind: "person" | "agent" }
  readonly action: string
  readonly target: string
  readonly at: string
  readonly tone?: "default" | "success" | "warning" | "destructive"
}

export const SAMPLE_ACTIVITY: readonly SampleActivity[] = [
  { id: "a1", actor: { name: "Invoice chaser", kind: "agent" }, action: "needs approval for", target: "6 overdue reminders", at: "2026-09-25T08:48:00+10:00", tone: "warning" },
  { id: "a2", actor: { name: "Ava Chen", kind: "person" }, action: "approved", target: "Weekly KPI pack for Northside Physio", at: "2026-09-25T08:30:00+10:00", tone: "success" },
  { id: "a3", actor: { name: "Lead enricher", kind: "agent" }, action: "failed on", target: "Coastline Recruitment leads (API timeout)", at: "2026-09-25T08:16:00+10:00", tone: "destructive" },
  { id: "a4", actor: { name: "Sam Patel", kind: "person" }, action: "connected Xero for", target: "Lumen Accounting", at: "2026-09-24T15:02:00+10:00" },
  { id: "a5", actor: { name: "Reconciler", kind: "agent" }, action: "matched", target: "212 bank lines", at: "2026-09-24T07:33:00+10:00", tone: "success" },
]

export type SampleTask = {
  readonly id: string
  readonly title: string
  readonly client: string
  readonly due: string | null
  readonly assignee: { readonly name: string; readonly initials: string } | null
  readonly priority: "high" | "medium" | "low"
  readonly done: boolean
}

export const SAMPLE_TASKS: readonly SampleTask[] = [
  { id: "t1", title: "Review invoice reminder drafts", client: "Kestrel Logistics", due: "2026-09-25", assignee: { name: "Jordan Lee", initials: "JL" }, priority: "high", done: false },
  { id: "t2", title: "Fix lead enricher API key", client: "Coastline Recruitment", due: "2026-09-25", assignee: { name: "Sam Patel", initials: "SP" }, priority: "high", done: false },
  { id: "t3", title: "Kick-off call: data access", client: "Bay Grammar", due: "2026-09-29", assignee: { name: "Ava Chen", initials: "AC" }, priority: "medium", done: false },
  { id: "t4", title: "Confirm billing contact", client: "Tidewater Dental", due: null, assignee: null, priority: "low", done: false },
  { id: "t5", title: "Send September report", client: "Northside Physio", due: "2026-09-24", assignee: { name: "Ava Chen", initials: "AC" }, priority: "medium", done: true },
]
