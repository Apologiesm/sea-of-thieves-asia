import Link from "next/link";
import { CREW_OPTIONS } from "@/lib/content/site-config";
import type { CrewFilters as Filters } from "@/lib/crew/types";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-content outline-none focus:border-brand";
const labelClass = "block text-xs font-semibold uppercase tracking-[0.12em] text-content-muted";

type Props = { filters: Filters };

export function CrewFilters({ filters }: Props) {
  return (
    <form method="get" className="rounded-card border border-border bg-surface/60 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className={labelClass}>Search</span>
          <input name="q" defaultValue={filters.q} placeholder="Title or description" className={fieldClass} />
        </label>
        <label>
          <span className={labelClass}>Region</span>
          <select name="region" defaultValue={filters.region} className={fieldClass}>
            <option value="">All regions</option>
            {CREW_OPTIONS.regions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Platform</span>
          <select name="platform" defaultValue={filters.platform} className={fieldClass}>
            <option value="">All platforms</option>
            {CREW_OPTIONS.platforms.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Language</span>
          <select name="language" defaultValue={filters.language} className={fieldClass}>
            <option value="">All languages</option>
            {CREW_OPTIONS.languages.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Playstyle</span>
          <select name="playstyle" defaultValue={filters.playstyle} className={fieldClass}>
            <option value="">Any playstyle</option>
            {CREW_OPTIONS.playstyles.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Ship preference</span>
          <select name="shipPreference" defaultValue={filters.shipPreference} className={fieldClass}>
            <option value="">Any ship</option>
            {CREW_OPTIONS.shipPreferences.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Role preference</span>
          <select name="rolePreference" defaultValue={filters.rolePreference} className={fieldClass}>
            <option value="">Any role</option>
            {CREW_OPTIONS.rolePreferences.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Availability</span>
          <select name="availability" defaultValue={filters.availability} className={fieldClass}>
            <option value="">Any availability</option>
            {CREW_OPTIONS.availability.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-canvas hover:bg-brand-strong"
        >
          Apply filters
        </button>
        <Link href="/crew" className="inline-flex min-h-11 items-center px-2 text-sm text-content-muted underline underline-offset-4">
          Clear
        </Link>
      </div>
    </form>
  );
}
