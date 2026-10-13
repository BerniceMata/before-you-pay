// node --test   (no network)
import { test } from "node:test";
import assert from "node:assert/strict";
import { rightsFor, checkLines, addDays } from "../web/rules.js";
import { letter } from "../web/letters.js";

const base = { state: "TX", setting: "hospital", insured: false, amount: 3200, billDate: "2026-09-01", itemized: false,
  nonprofit: "unsure", gfe: true, gfeAmount: 1800, surprise: "no", denied: false, collections: false };

test("uninsured bill $1,400 over the estimate gets the dispute with a 120-day deadline, ranked first", () => {
  const r = rightsFor(base, "2026-10-13");
  assert.equal(r[0].id, "gfe");
  assert.equal(r[0].deadline, addDays("2026-09-01", 120));
  assert.equal(r[0].daysLeft, 78);
});

test("$399 over the estimate does not qualify for the dispute", () => {
  const r = rightsFor({ ...base, amount: 2199 }, "2026-10-13");
  assert.ok(!r.some((x) => x.id === "gfe"));
});

test("for-profit hospital in a state without a charity law gets 'ask anyway', with no federal 501(r) source", () => {
  const r = rightsFor({ ...base, nonprofit: "no" }).find((x) => x.id === "fap");
  assert.match(r.title, /Ask anyway/);
  assert.ok(!r.sources.some((s) => s.url.includes("501r")));
  assert.ok(rightsFor(base).find((x) => x.id === "fap").sources.some((s) => s.url.includes("501r")));
});

test("insured surprise bill gets the No Surprises Act letter, not the GFE dispute", () => {
  const r = rightsFor({ ...base, insured: true, surprise: "yes" });
  assert.ok(r.some((x) => x.id === "nsa"));
  assert.ok(!r.some((x) => x.id === "gfe" || x.id === "nogfe"));
});

test("Texas itemized right cites SB 490; other states do not", () => {
  const tx = rightsFor(base).find((x) => x.id === "itemized");
  const ca = rightsFor({ ...base, state: "CA" }).find((x) => x.id === "itemized");
  assert.equal(tx.sources.length, 2);
  assert.equal(ca.sources.length, 1);
});

test("line checker catches an exact duplicate and a quantity > 1", () => {
  const { findings } = checkLines([
    { date: "09/01", code: "85025", desc: "CBC", qty: 1, amount: 120 },
    { date: "09/01", code: "85025", desc: "CBC", qty: 1, amount: 120 },
    { date: "09/01", code: "J1100", desc: "injection", qty: 3, amount: 90 },
  ]);
  assert.deepEqual(findings.map((f) => f.kind).sort(), ["duplicate", "quantity"]);
});

test("letters leave visible blanks instead of inventing details", () => {
  const t = letter("itemized", { state: "TX" });
  assert.match(t, /\[Account number\]/);
  assert.match(t, /Texas law/);
});

test("public hospital gets its own charity-care card, not the 501(r) one", () => {
  const r = rightsFor({ ...base, nonprofit: "government" }).find((x) => x.id === "fap");
  assert.match(r.title, /own charity care/);
  assert.equal(r.deadline, null);
});

test("hospital lookup files exist for TX and classify ownership into three kinds", async () => {
  const fs = await import("node:fs");
  const tx = JSON.parse(fs.readFileSync(new URL("../web/hospitals/TX.json", import.meta.url)));
  assert.ok(tx.length > 400);
  assert.deepEqual([...new Set(tx.map((h) => h[2]))].sort(), ["for-profit", "government", "nonprofit"]);
});

test("for-profit hospital in California still gets charity care, by state law", () => {
  const r = rightsFor({ ...base, state: "CA", nonprofit: "no" }).find((x) => x.id === "fap");
  assert.match(r.title, /state requires it/);
  assert.equal(r.deadline, null);
});

test("New York shows no 240-day countdown; Washington keeps a soft one", () => {
  assert.equal(rightsFor({ ...base, state: "NY" }).find((x) => x.id === "fap").deadline, null);
  const wa = rightsFor({ ...base, state: "WA" }).find((x) => x.id === "fap");
  assert.ok(wa.deadline && wa.soft);
});

test("federal 501(r) card is soft: it is never sorted as a hard deadline ahead of the GFE dispute", () => {
  const r = rightsFor(base, "2026-10-13");
  assert.equal(r[0].id, "gfe");
  assert.ok(r.find((x) => x.id === "fap").soft);
});

test("estimate received late keeps the dispute card but says the process may not be open", () => {
  const r = rightsFor({ ...base, gfeEarly: false }).find((x) => x.id === "gfe");
  assert.match(r.why, /may not be open/);
});

test("Texas itemized right now cites the statute", () => {
  const tx = rightsFor(base).find((x) => x.id === "itemized");
  assert.ok(tx.sources.some((s) => s.url.includes("185.002")));
});

test("Spanish strings exist for every English key and the cards come back in Spanish", async () => {
  const { STR } = await import("../web/rules.js");
  assert.deepEqual(Object.keys(STR.es).sort(), Object.keys(STR.en).sort());
  const r = rightsFor(base, "2026-10-13", "es");
  assert.match(r[0].title, /estimación de buena fe/);
  assert.ok(r.every((x) => !/\b(the|and|your)\b/i.test(x.title)));
});

test("line findings carry a first-person ask for the letter, separate from the advice to the user", () => {
  const { findings } = checkLines([{ date: "09/01", code: "99284", desc: "ER", qty: 1, amount: 1450 }, { date: "09/01", code: "99284", desc: "ER", qty: 1, amount: 1450 }, { date: "09/01", code: "36415", desc: "draw", qty: 3, amount: 300 }]);
  for (const f of findings) { assert.ok(f.ask && !/^Ask |Ask whether|ask what/.test(f.ask)); }
  const t = letter("errors", {}, { disputed: [{ date: "09/01", code: "99284", desc: "ER", amount: 1450, ask: findings.find((f) => f.kind === "duplicate").ask }] });
  assert.match(t, /\$1,450: this charge is identical/);
  assert.ok(!/Ask whether you received it twice/.test(t));
});
