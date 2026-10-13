// Engineering check 2026-10-13 tickets: rules, letters and helpers. node --test, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rightsFor, checkLines, addDays, checkDate, validateBill, followUpDate, isUrgent, normText, matchHospitals, exactHospital, normalizeLineDate, RULES_CHECKED, SOURCES } from "../web/rules.js";
import { letter } from "../web/letters.js";

const base = { state: "TX", setting: "hospital", insured: false, amount: 3200, billDate: "2026-09-01", itemized: false,
  nonprofit: "unsure", gfe: true, gfeAmount: 1800, surprise: "no", denied: false, collections: false };
const coll = { ...base, collections: true, gfe: false };

test("SITE-03: collections card counts 30 days from the collector's first notice, not the bill date", () => {
  const r = rightsFor({ ...coll, collectorNotice: "2026-10-01" }, "2026-10-13").find((x) => x.id === "collections");
  assert.equal(r.deadline, addDays("2026-10-01", 30));
  assert.equal(r.daysLeft, 18);
  assert.ok(!r.soft);
  assert.match(r.deadlineLabel, /collector's first notice/);
  assert.match(r.action, /collector \(not the hospital\)/);
});

test("SITE-03: collections countdown is red at 7 days or less, not before", () => {
  const at = (notice) => rightsFor({ ...coll, collectorNotice: notice }, "2026-10-13").find((x) => x.id === "collections");
  assert.equal(at("2026-09-16").daysLeft, 3);
  assert.ok(isUrgent(at("2026-09-16")));
  assert.equal(at("2026-09-13").daysLeft, 0);
  assert.ok(isUrgent(at("2026-09-13")));
  assert.equal(at("2026-09-20").daysLeft, 7);
  assert.ok(isUrgent(at("2026-09-20")));
  assert.equal(at("2026-09-21").daysLeft, 8);
  assert.ok(!isUrgent(at("2026-09-21")));
});

test("SITE-03: no notice date means no countdown; a future or junk notice date is ignored; a passed window says so", () => {
  const find = (n) => rightsFor({ ...coll, collectorNotice: n }, "2026-10-13").find((x) => x.id === "collections");
  assert.equal(find("").deadline, null);
  assert.equal(find(undefined).deadline, null);
  assert.equal(find("2026-12-01").deadline, null);
  assert.equal(find("not a date").deadline, null);
  const late = find("2026-08-01");
  assert.ok(late.daysLeft < 0);
  assert.match(late.why, /have passed/);
  assert.ok(!/have passed/.test(find("2026-10-01").why));
  assert.match(rightsFor({ ...coll, collectorNotice: "2026-08-01" }, "2026-10-13", "es").find((x) => x.id === "collections").why, /Ya pasaron los 30 días/);
});

test("SITE-03: the debt validation letter goes to the collector; the hospital letters do not change", () => {
  const f = { name: "Ana Perez", provider: "Methodist Dallas", providerAddress: "1 Hospital Way", collector: "Acme Recovery LLC", collectorAddress: "9 Collector Rd, Plano TX", collectorNotice: "2026-10-01", state: "TX" };
  const v = letter("validation", f);
  assert.equal(v.split("\n\n")[1], "Acme Recovery LLC\n9 Collector Rd, Plano TX");
  assert.ok(!v.includes("Billing Department"));
  assert.match(v, /Original creditor: Methodist Dallas/);
  assert.match(v, /Your first notice about this debt is dated October 1, 2026\./);
  assert.ok(!v.includes("1 Hospital Way"));
  for (const id of ["itemized", "fap", "gfe", "nsa", "errors"]) {
    const t = letter(id, f, {});
    assert.equal(t.split("\n\n")[1], "Methodist Dallas\nBilling Department\n1 Hospital Way", id);
    assert.ok(!t.includes("Acme Recovery"));
  }
});

test("SITE-03: collector blanks stay visible instead of inventing a name", () => {
  const v = letter("validation", { state: "TX" });
  assert.match(v, /\[Collection agency name\]\n\[Collection agency address\]/);
  assert.match(v, /Original creditor: \[Hospital or provider name\]/);
  assert.ok(!/Your first notice about this debt/.test(v));
});

const HOSPS = [
  ["Methodist Hospital  Stone Oak", "San Antonio", "nonprofit", "(210) 555-0100"],
  ["Methodist Dallas Medical Center", "Dallas", "nonprofit", "(214) 555-0101"],
  ["Methodist Richardson Medical Center", "Richardson", "nonprofit", "(972) 555-0102"],
  ["St. Luke's Health", "Houston", "nonprofit", "(713) 555-0103"],
  ["Baylor Scott & White Medical Center", "Dallas", "nonprofit", "(214) 555-0104"],
];

test("SITE-04: hospital lookup ignores case and double spaces, and matches on any part of the name or city", () => {
  assert.equal(normText("Methodist Hospital  Stone Oak"), "methodist hospital stone oak");
  assert.equal(matchHospitals(HOSPS, "methodist hospital stone oak")[0][1], "San Antonio");
  assert.equal(matchHospitals(HOSPS, "  METHODIST   DALLAS ")[0][0], "Methodist Dallas Medical Center");
  assert.equal(matchHospitals(HOSPS, "medical center richardson")[0][1], "Richardson");
  assert.equal(matchHospitals(HOSPS, "st luke")[0][1], "Houston");
  assert.equal(matchHospitals(HOSPS, "stone oak")[0][1], "San Antonio");
  assert.equal(matchHospitals(HOSPS, "baylor scott white")[0][1], "Dallas");
  assert.deepEqual(matchHospitals(HOSPS, ""), []);
  assert.deepEqual(matchHospitals(HOSPS, "zzzz"), []);
});

test("SITE-04: results are capped at 8 and ranked: name starts with the text before a loose match", () => {
  const many = Array.from({ length: 30 }, (_, i) => [`Valley Hospital ${i}`, "Austin", "nonprofit", ""]);
  many.push(["Regional Valley Clinic", "Waco", "nonprofit", ""]);
  assert.equal(matchHospitals(many, "valley").length, 8);
  assert.equal(matchHospitals(many, "valley", 40).at(-1)[0], "Regional Valley Clinic");
});

test("SITE-04: exactHospital picks a hospital only on an exact name or Name (City), never on a loose match", () => {
  assert.equal(exactHospital(HOSPS, "Methodist Dallas Medical Center (Dallas)")[1], "Dallas");
  assert.equal(exactHospital(HOSPS, "methodist hospital  stone oak")[1], "San Antonio");
  assert.equal(exactHospital(HOSPS, "Methodist Dallas"), null);
  const twin = [["Memorial Hospital", "Tyler", "nonprofit", ""], ["Memorial Hospital", "Austin", "for-profit", ""]];
  assert.equal(exactHospital(twin, "Memorial Hospital"), null);
  assert.equal(exactHospital(twin, "Memorial Hospital (Austin)")[2], "for-profit");
});

test("SITE-04: the real TX list finds Methodist Dallas without the city, and the quirky double-space name", async () => {
  const fs = await import("node:fs");
  const tx = JSON.parse(fs.readFileSync(new URL("../web/hospitals/TX.json", import.meta.url)));
  assert.ok(matchHospitals(tx, "methodist dallas medical center").some((h) => h[1] === "Dallas"));
  const quirky = tx.find((h) => /  /.test(h[0]));
  if (quirky) assert.equal(exactHospital(tx, quirky[0].replace(/ +/g, " ")), quirky);
});

test("SITE-15: future and unreadable dates are rejected, blank amount counts as 0 and is flagged", () => {
  assert.deepEqual(checkDate("2026-10-14", "2026-10-13"), { value: "", issue: "future_date" });
  assert.deepEqual(checkDate("2026-10-13", "2026-10-13"), { value: "2026-10-13", issue: "" });
  assert.deepEqual(checkDate("2026-02-30", "2026-10-13"), { value: "", issue: "bad_date" });
  assert.deepEqual(checkDate("", "2026-10-13"), { value: "", issue: "" });
  assert.deepEqual(validateBill({ amount: "", billDate: "2027-03-01" }, "2026-10-13"), { billDate: "", amount: 0, issues: ["future_date"] });
  assert.deepEqual(validateBill({ amount: "", billDate: "2026-09-01" }, "2026-10-13"), { billDate: "2026-09-01", amount: 0, issues: ["blank_amount"] });
  assert.deepEqual(validateBill({ amount: "3200", billDate: "2026-09-01" }, "2026-10-13"), { billDate: "2026-09-01", amount: 3200, issues: [] });
  assert.deepEqual(validateBill({ amount: "", billDate: "" }, "2026-10-13"), { billDate: "", amount: 0, issues: [] });
  assert.equal(validateBill({ amount: "-5", billDate: "2026-09-01" }, "2026-10-13").amount, 0);
});

test("SITE-15: line-table dates compare after normalizing (9/1 is 09/01)", () => {
  assert.equal(normalizeLineDate("9/1"), "09/01");
  assert.equal(normalizeLineDate(" 09/01 "), "09/01");
  assert.equal(normalizeLineDate("9-1"), "09/01");
  assert.equal(normalizeLineDate("9/1/26"), "09/01/2026");
  assert.equal(normalizeLineDate("2026-09-01"), "09/01/2026");
  assert.equal(normalizeLineDate("Sept 1"), "sept 1");
  const { findings } = checkLines([
    { date: "9/1", code: "99284", desc: "ER visit", qty: 1, amount: 1450 },
    { date: "09/01", code: "99284", desc: "ER visit", qty: 1, amount: 1450 },
  ]);
  assert.deepEqual(findings.map((f) => f.kind), ["duplicate"]);
  const diff = checkLines([{ date: "9/1", code: "1", desc: "a", qty: 1, amount: 10 }, { date: "9/2", code: "1", desc: "a", qty: 1, amount: 10 }]);
  assert.equal(diff.findings.length, 0);
});

test("PROD-03: the follow-up date is today plus 30 days", () => {
  assert.equal(followUpDate("2026-10-13"), "2026-11-12");
  assert.equal(followUpDate("2026-12-15"), "2027-01-14");
});

test("PROD-04: rules-last-checked date is set", () => {
  assert.equal(RULES_CHECKED, "2026-10-13");
});

test("PROD-02: insured, no denial, not a surprise bill gets the EOB card with its source, in both languages", () => {
  const a = { ...base, insured: true, surprise: "no", denied: false, gfe: false };
  const en = rightsFor(a, "2026-10-13").find((x) => x.id === "eob");
  assert.equal(en.title, "Check the bill against your insurance statement (EOB)");
  assert.equal(en.sources[0].url, "https://www.healthcare.gov/glossary/explanation-of-benefits/");
  assert.ok(en.why.length > 40 && en.action.length > 40);
  const es = rightsFor(a, "2026-10-13", "es").find((x) => x.id === "eob");
  assert.match(es.title, /EOB/);
  assert.equal(es.sources[0].url, SOURCES.eob.url);
  assert.ok(!/\b(the|and|your)\b/i.test(es.title));
  assert.equal(rightsFor({ ...a, setting: "doctor" }, "2026-10-13").length, 2);
});

test("PROD-02: the EOB card does not appear for denial, surprise-bill or uninsured paths", () => {
  const ids = (o) => rightsFor({ ...base, gfe: false, ...o }, "2026-10-13").map((x) => x.id);
  assert.ok(!ids({ insured: true, surprise: "no", denied: true }).includes("eob"));
  assert.ok(!ids({ insured: true, surprise: "yes" }).includes("eob"));
  assert.ok(!ids({ insured: true, surprise: "unsure" }).includes("eob"));
  assert.ok(!ids({ insured: false }).includes("eob"));
});

test("soft deadlines are never urgent; other cards go red at 30 days", () => {
  assert.ok(!isUrgent({ daysLeft: 2, soft: true }));
  assert.ok(isUrgent({ daysLeft: 30 }));
  assert.ok(!isUrgent({ daysLeft: 31 }));
  assert.ok(!isUrgent({ daysLeft: null }));
});
