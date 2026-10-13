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

test("for-profit hospital gets no 501(r) financial assistance right", () => {
  assert.ok(!rightsFor({ ...base, nonprofit: "no" }).some((x) => x.id === "fap"));
  assert.ok(rightsFor(base).some((x) => x.id === "fap"));
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
