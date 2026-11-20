import Link from "next/link";
import {
  EVENT_REGIONS,
  EVENT_PLATFORMS,
  EVENT_STATUSES,
  EVENT_TYPES,
} from "@/lib/content/site-config";
import type { EventFilters as Filters } from "@/lib/event/types";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content outline-none focus:border-brand";
const labelClass = "block text-xs font-semibold uppercase tracking-[0.12em] text-content-muted";

export function EventFilters({ filters, includeStatus = false }: { filters: Filters; includeStatus?: boolean }) {
  return (
    <form method="get" className="rounded-card border border-border bg-surface/60 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className={labelClass}>Type</span>
          <select name="type" defaultValue={filters.type} className={fieldClass}>
            <option value="">All types</option>
            {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Region</span>
          <select name="region" defaultValue={filters.region} className={fieldClass}>
            <option value="">All regions</option>
            {EVENT_REGIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Platform</span>
          <select name="platform" defaultValue={filters.platform} className={fieldClass}>
            <option value="">All platforms</option>
            {EVENT_PLATFORMS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Date</span>
          <input type="date" name="date" defaultValue={filters.date} className={fieldClass} />
        </label>
        {includeStatus ? (
          <label>
            <span className={labelClass}>Status</span>
            <select name="status" defaultValue={filters.status} className={fieldClass}>
              <option value="all">All statuses</option>
              {EVENT_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-brand-strong"
        >
          Apply filters
        </button>
        <Link href={includeStatus ? "/events/manage" : "/events"} className="inline-flex min-h-11 items-center px-2 text-sm text-content-muted underline underline-offset-4">
          Clear
        </Link>
      </div>
    </form>
  );
}
