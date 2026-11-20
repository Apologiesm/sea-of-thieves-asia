"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

export type SortableItem = {
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
};

type DragState = {
  id: string;
  card: HTMLElement;
  placeholder: HTMLElement;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  frame: number;
  cleanup: () => void;
};

type Props = {
  items: SortableItem[];
  order: string[];
  onChange: (order: string[]) => void;
};

export function SortableList({ items, order, onChange }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLDivElement>());
  const drag = useRef<DragState | null>(null);
  const [grabbed, setGrabbed] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => () => drag.current?.cleanup(), []);

  const ordered = order
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is SortableItem => Boolean(item));
  items.forEach((item) => {
    if (!order.includes(item.id)) ordered.push(item);
  });

  function renderDrag() {
    const state = drag.current;
    const list = listRef.current;
    if (!state || !list) return;

    state.card.style.left = `${state.x - state.offsetX}px`;
    state.card.style.top = `${state.y - state.offsetY}px`;

    const others = Array.from(list.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child !== state.card &&
        child !== state.placeholder &&
        child.classList.contains("sortable-card"),
    );
    const target = others.find((card) => {
      const rect = card.getBoundingClientRect();
      return state.y < rect.top + rect.height / 2;
    });
    list.insertBefore(state.placeholder, target ?? null);
    state.frame = 0;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>, id: string) {
    if (event.button !== 0) return;
    const card = cards.current.get(id);
    const list = listRef.current;
    if (!card || !list || drag.current) return;

    const rect = card.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = "sortable-placeholder";
    placeholder.style.height = `${rect.height}px`;
    list.insertBefore(placeholder, card);

    card.style.position = "fixed";
    card.style.left = `${rect.left}px`;
    card.style.top = `${rect.top}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.style.zIndex = "5";
    card.style.pointerEvents = "none";
    card.classList.add("dragging");
    card.setAttribute("aria-grabbed", "true");
    setGrabbed(id);

    const move = (native: PointerEvent) => {
      if (!drag.current) return;
      drag.current.x = native.clientX;
      drag.current.y = native.clientY;
      if (!drag.current.frame) drag.current.frame = window.requestAnimationFrame(renderDrag);
    };

    const finish = () => {
      const state = drag.current;
      if (!state) return;
      if (state.frame) window.cancelAnimationFrame(state.frame);
      state.cleanup();
      list.insertBefore(state.card, state.placeholder);
      state.placeholder.remove();
      state.card.style.removeProperty("position");
      state.card.style.removeProperty("left");
      state.card.style.removeProperty("top");
      state.card.style.removeProperty("width");
      state.card.style.removeProperty("height");
      state.card.style.removeProperty("z-index");
      state.card.style.removeProperty("pointer-events");
      state.card.classList.remove("dragging");
      state.card.setAttribute("aria-grabbed", "false");

      const next = Array.from(list.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement && Boolean(child.dataset.id))
        .map((child) => child.dataset.id as string);

      drag.current = null;
      setGrabbed(null);
      onChange(next);
      setAnnouncement(`Order updated. ${next.length} sections.`);
    };

    const cleanup = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);
    };

    drag.current = {
      id,
      card,
      placeholder,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      x: event.clientX,
      y: event.clientY,
      frame: 0,
      cleanup,
    };

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerup", finish, { once: true });
    document.addEventListener("pointercancel", finish, { once: true });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, id: string) {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    event.preventDefault();
    const index = order.indexOf(id);
    if (index < 0) return;
    const targetIndex = event.key === "ArrowUp" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const next = [...order];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const label = items.find((item) => item.id === id)?.title ?? id;
    onChange(next);
    setAnnouncement(`${label} moved to position ${targetIndex + 1} of ${next.length}.`);
  }

  return (
    <div>
      <div ref={listRef} className="sortable-list" role="list" aria-label="Homepage section order">
        {ordered.map((item) => (
          <div
            key={item.id}
            ref={(element) => {
              if (element) cards.current.set(item.id, element);
              else cards.current.delete(item.id);
            }}
            className="sortable-card"
            data-id={item.id}
            role="listitem"
            tabIndex={0}
            aria-grabbed={grabbed === item.id}
            onPointerDown={(event) => onPointerDown(event, item.id)}
            onKeyDown={(event) => onKeyDown(event, item.id)}
          >
            <span className="sortable-grip" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
              </svg>
            </span>
            <div className="sortable-copy">
              <strong>{item.title}</strong>
              <small>{item.subtitle}</small>
            </div>
            <span className="sortable-avatar" aria-hidden="true">{item.avatar}</span>
          </div>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </div>
  );
}
