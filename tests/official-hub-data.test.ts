import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findHubPanel,
  hubTimestamp,
  indexHubPanels,
  panelKey,
  parseHubPanels,
} from "../src/lib/official/hub-data.ts";

/**
 * The Event Hub serialises its whole component tree as JSON inside the page.
 * These fixtures are cut down from real output: the panel keys, the empty
 * markup images and the "2026-11-25 10:00:14Z" timestamp shape are what the CMS
 * actually writes.
 */
const DATED_PANEL = `{"#Name":"PESale","#Type":"EventPanel","FeaturedData":{"Title":"Black Friday Sale","BodyText":"Browse discounts of up to 50%.","Image":{"small-phone":"https://rare-assets.azureedge.net/assets/c2/26/tb.jpg?n=Adventure16x9_01_tb.jpg","desktop":"https://rare-assets.azureedge.net/assets/af/b3/dt.jpg?n=Adventure16x9_01_dt.jpg","largeDesktop":""},"CTA":{"ButtonText":"","Url":""}},"FallbackData":{"Title":"Pirate Emporium Sales","BodyText":"Fallback copy."},"StartDate":"2026-11-25 10:00:14Z","EndDate":"2026-12-02 10:00:38Z","DateString":"Check Back Soon"}`;

const WEEKLY_PANEL = `{"#Name":"WeeklyFightNights","#Type":"EventPanel","FeaturedData":{"Title":"","BodyText":""},"FallbackData":{"Title":"Weekly Fight Nights","BodyText":"The Battle for the Sea of Thieves rages on!","Image":{"tablet":"https://rare-assets.azureedge.net/assets/fe/2c/tb.jpg?n=Adventure16x9_01_tb.jpg","desktop":"https://rare-assets.azureedge.net/assets/fe/2c/dt.jpg?n=Adventure16x9_01_dt.jpg"}},"StartDate":null,"EndDate":null,"DateString":"Weekly (from Tuesday 10am UTC)"}`;

const STATUS_PANEL = `{"#Name":"Season","#Type":"EventPanel","FeaturedData":{"Title":"Season 21 Live Now!","BodyText":"New rewards.","Image":{"desktop":"https://rare-assets.azureedge.net/assets/42/12/dt.jpg"},"CTA":{"Url":"/season-21"}},"StartDate":null,"EndDate":null,"DateString":""}`;

const NO_TITLE_PANEL = `{"#Name":"Orphan","#Type":"EventPanel","FeaturedData":{"Title":"","BodyText":"No heading here."},"FallbackData":{"Title":""}}`;

const IMAGE_LESS_PANEL = `{"#Name":"GoldRush","#Type":"EventPanel","FallbackData":{"Title":"Gold Rush","Image":{"desktop":""}},"DateString":"Twice Daily: 1am - 2am and 5pm - 6pm UTC"}`;

/** The real page wraps panels in escaped markup and surrounding script tags. */
function page(...panels: string[]): string {
  return `<html><body><div class="event-panel"></div><script type="application/json">{"data":{"components":[{"component":"EventBucket","data":{"EventPanelList":{"EventPanelList":[${panels.join(
    ",",
  )}]}}}]}}</script></body></html>`;
}

test("reads the heading from the fallback block when the feature block is empty", () => {
  const [panel] = parseHubPanels(page(WEEKLY_PANEL));
  assert.equal(panel.name, "Weekly Fight Nights");
  assert.equal(panel.dateString, "Weekly (from Tuesday 10am UTC)");
  assert.equal(panel.imageUrl, "https://rare-assets.azureedge.net/assets/fe/2c/dt.jpg?n=Adventure16x9_01_dt.jpg");
});

test("keeps the real UTC window from the CMS instead of the prose date", () => {
  const [panel] = parseHubPanels(page(DATED_PANEL));
  assert.equal(panel.startsAt, "2026-11-25T10:00:14.000Z");
  assert.equal(panel.endsAt, "2026-12-02T10:00:38.000Z");
  assert.equal(panel.dateString, "Check Back Soon");
});

test("recurring panels carry no window, only their wording", () => {
  const [panel] = parseHubPanels(page(IMAGE_LESS_PANEL));
  assert.equal(panel.name, "Gold Rush");
  assert.equal(panel.startsAt, null);
  assert.equal(panel.endsAt, null);
  assert.equal(panel.imageUrl, null);
});

test("a panel without a heading is dropped rather than shown blank", () => {
  const panels = parseHubPanels(page(NO_TITLE_PANEL, STATUS_PANEL));
  assert.deepEqual(
    panels.map((panel) => panel.name),
    ["Season 21 Live Now!"],
  );
});

test("resolves the call to action to an absolute official URL", () => {
  const [panel] = parseHubPanels(page(STATUS_PANEL));
  assert.equal(panel.ctaUrl, "https://www.seaofthieves.com/season-21");
});

test("a status suffix in the heading still finds its panel", () => {
  const index = indexHubPanels(parseHubPanels(page(STATUS_PANEL, WEEKLY_PANEL)));
  assert.equal(findHubPanel(index, "Season 21")?.slug, "Season");
  assert.equal(findHubPanel(index, "Weekly Fight Nights")?.slug, "WeeklyFightNights");
});

test("survives a truncated payload instead of throwing", () => {
  const truncated = `<script>{"#Name":"Broken","#Type":"EventPanel","FeaturedData":{"Title":"Half`;
  assert.deepEqual(parseHubPanels(truncated), []);
});

test("timestamps are normalised to ISO and bad values become null", () => {
  assert.equal(hubTimestamp("2026-11-06 10:00:04Z"), "2026-11-06T10:00:04.000Z");
  assert.equal(hubTimestamp("not a date"), null);
  assert.equal(hubTimestamp(null), null);
});

test("panel keys ignore case and punctuation", () => {
  assert.equal(panelKey("Weekly Fight Nights"), "weeklyfightnights");
  assert.equal(panelKey("Gold Rush  "), "goldrush");
});
