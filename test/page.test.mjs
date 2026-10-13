// Static checks on web/index.html (no browser, no network): translations stay in step, accessibility hooks exist,
// the print and mobile CSS are present, and the page makes no new network calls.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
const script = html.slice(html.indexOf('<script type="module">'), html.indexOf("</script>"));
const css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
const { T, UI } = new Function("lang", script.slice(script.indexOf("const T = {"), script.indexOf("const u = () => UI[lang];")) + "; return { T, UI };")("en");

test("UI.en and UI.es have the same keys, including field labels and letter kinds", () => {
  const keys = (o) => Object.keys(o).filter((k) => k !== "about" && k !== "esnote").sort();
  assert.deepEqual(keys(UI.es), keys(UI.en));
  assert.deepEqual(Object.keys(UI.es.fields).sort(), Object.keys(UI.en.fields).sort());
  assert.deepEqual(Object.keys(UI.es.kinds).sort(), Object.keys(UI.en.kinds).sort());
  for (const k of keys(UI.en)) assert.equal(typeof UI.es[k], typeof UI.en[k], k);
});

test("function strings in both languages return real text", () => {
  for (const l of ["en", "es"]) {
    const u = UI[l];
    for (const s of [u.seeThem(1), u.seeThem(4), u.apply(1), u.apply(2), u.rulesChecked("2026-10-13"), u.next("Friday, November 13, 2026"), u.left(3, "x"), u.passed(2)]) {
      assert.ok(typeof s === "string" && s.length > 5, l);
    }
    assert.ok(u.rulesChecked("2026-10-13").includes("2026-10-13"));
    assert.ok(u.next("WHEN").includes("WHEN") && u.next("WHEN").includes("1-800-985-3059"));
  }
});

test("PROD-03 'what happens next' covers mail, 30 days, the follow-up date and the CMS help line", () => {
  const n = UI.en.next("Friday, November 13");
  for (const part of ["certified mail", "portal", "Keep a copy", "about 30 days", "Follow up on <b>Friday, November 13</b>", "1-800-985-3059"]) assert.ok(n.includes(part), part);
  assert.match(UI.es.next("viernes"), /correo certificado/);
  assert.match(UI.es.next("viernes"), /30 días/);
});

test("English count label pluralizes (1 applies, 3 apply) and the phone bar does too", () => {
  assert.equal(UI.en.apply(1), "1 right applies");
  assert.equal(UI.en.apply(3), "3 rights apply");
  assert.equal(UI.en.seeThem(3), "3 rights apply, see them");
  assert.equal(UI.es.apply(1), "1 derecho le aplica");
  assert.equal(UI.es.seeThem(3), "3 derechos le aplican, véalos");
});

test("PROD-01: plain-language helpers and the 'have these ready' line exist and are translated", () => {
  const lines = [
    "A Good Faith Estimate is a written price estimate a provider must give uninsured or self-pay patients before scheduled care.",
    "An itemized bill lists every service, its billing code and its charge, not just one total.",
    "The date printed on the first bill you got for this care, not the date of the care.",
    "Collections means the provider handed the bill to a debt collector, and now the collector is the one writing to you.",
    "Have these ready:", "the bill, the insurance statement (EOB) if any, any estimate you were given.",
  ];
  for (const s of lines) { assert.ok(html.includes(s), s); assert.ok(T[s], "no Spanish for: " + s); }
});

test("SITE-03 / PROD-04 static strings exist in the page and in Spanish", () => {
  for (const s of ["Collector's name", "Collector's address", "Date of the collector's first notice", "Report a wrong rule:",
    "Nothing you type leaves this page; we count anonymous page events, never answers"]) {
    assert.ok(html.includes(s), s); assert.ok(T[s], s);
  }
  assert.ok(html.includes('href="mailto:support@mitchloveswords.com"'));
  assert.ok(html.includes('id="rulesChecked"'));
  assert.ok(script.includes("RULES_CHECKED"));
});

test("every translation key appears in the page (no dead keys)", () => {
  for (const k of Object.keys(T)) {
    assert.ok(html.includes(k) || html.includes(k.replace(/·/g, "&middot;")), "dead translation key: " + k);
  }
});

test("SITE-06: every question is a labelled group, the count is a live region, a phone bar jumps to #rights", () => {
  const qs = [...html.matchAll(/<div class="q"([^>]*)>/g)];
  assert.ok(qs.length >= 10);
  for (const [, attrs] of qs) {
    assert.match(attrs, /role="group"/);
    const ids = attrs.match(/aria-labelledby="([^"]+)"/)?.[1].split(" ");
    assert.ok(ids && ids.length, attrs);
    for (const id of ids) assert.ok(html.includes(`id="${id}"`), "missing label id " + id);
  }
  assert.match(html, /id="count" aria-live="polite"/);
  assert.match(html, /id="jump"/);
  assert.match(script, /\$\("rights"\)\.scrollIntoView/);
  assert.match(css, /\.jump:not\(\[hidden\]\)[^}]*position:fixed/);
  assert.match(css, /@media \(max-width:900px\)[\s\S]*\.jump/);
});

test("SITE-09: print shows only #letterText and the button prints the page itself", () => {
  const print = css.slice(css.indexOf("@media print"));
  assert.match(print, /\.wrap[^}]*display:none/);
  assert.match(print, /\.dlg aside[^}]*display:none/);
  assert.match(print, /\.dlg \.bar[^}]*display:none/);
  assert.match(print, /#letterText \{[^}]*background:#fff[^}]*color:#000|#letterText \{[^}]*color:#000[^}]*background:#fff/);
  assert.ok(!script.includes("window.open"));
  assert.match(script, /printBtn"\)\.onclick = \(\) => \{[^}]*window\.print\(\)/);
  assert.match(script, /classList\.add\("letter-open"\)/);
  assert.match(script, /"close", \(\) => document\.body\.classList\.remove\("letter-open"\)/);
});

test("SITE-20: 44px tap targets for remove-line and language buttons; sticky action bar on mobile", () => {
  assert.match(css, /\.lang button \{[^}]*min-height:44px/);
  assert.match(css, /\.btn\.del \{[^}]*min-width:44px[^}]*min-height:44px/);
  assert.match(script, /class="btn ghost del"/);
  assert.match(css, /@media \(max-width:760px\) \{[^@]*\.dlg \.bar \{[^}]*position:sticky[^}]*bottom:0/);
});

test("SITE-04: a visible result list exists and the no-match message is wired", () => {
  assert.match(html, /id="hospResults"/);
  assert.match(script, /matchHospitals\(hospitals, q, 8\)/);
  assert.match(script, /normText\(q\)\.length >= 3/);
  assert.match(UI.en.hospNone, /No match in the CMS list for your state/);
});

test("no new network calls: one fetch (this site's hospital file) and one beacon", () => {
  assert.equal((script.match(/\bfetch\(/g) || []).length, 1);
  assert.match(script, /fetch\(`hospitals\/\$\{st\}\.json`\)/);
  assert.equal((script.match(/sendBeacon\(/g) || []).length, 1);
  assert.ok(!/XMLHttpRequest|WebSocket|EventSource/.test(script));
});

test("no em dashes in the page, rules or letters", () => {
  for (const f of ["../web/index.html", "../web/rules.js", "../web/letters.js"]) {
    assert.ok(!fs.readFileSync(new URL(f, import.meta.url), "utf8").includes("—"), f);
  }
});
