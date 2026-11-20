"use client";

import { useState } from "react";

const ITEMS = [
  "Repair the ship before leaving the outpost",
  "Stock food, cannonballs and wood",
  "Agree the voyage route with the crew",
  "Assign helm, cannons and lookout",
  "Raise the right emissary flag",
  "Check the regional time and comms channel",
  "Keep an eye on the horizon on the way back",
];

export function VoyageChecklist() {
  const [checked, setChecked] = useState<boolean[]>(() => ITEMS.map(() => false));

  function toggle(index: number) {
    setChecked((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value));
  }

  const done = checked.filter(Boolean).length;
  const percent = Math.round((done / ITEMS.length) * 100);

  return (
    <div className="checklist">
      <div className="checklist__head">
        <h2 className="text-lg font-semibold text-content">Before you cast off</h2>
        <p className="mt-1 text-sm text-content-muted">A short, practical checklist. Nothing is saved or sent anywhere.</p>
      </div>
      <div className="checklist__progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={ITEMS.length}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="checklist__count">{done} of {ITEMS.length} ready · {percent}%</p>
      <ul className="checklist__items">
        {ITEMS.map((item, index) => (
          <li key={item}>
            <label>
              <input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} />
              <span className={checked[index] ? "checklist__done" : ""}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setChecked(ITEMS.map(() => false))} className="checklist__reset">
        Reset checklist
      </button>
    </div>
  );
}
