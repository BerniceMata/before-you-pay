// rules.js: which patient billing rights apply, with deadlines and sources. Pure function, runs in the browser.
// Every right cites the public rule it comes from. This is self-help information, not legal advice.

export const SOURCES = {
  hipaa: { label: "HHS: your right to access your health and billing records (45 CFR 164.524)", url: "https://www.hhs.gov/hipaa/for-individuals/right-to-access/index.html" },
  tx490: { label: "Texas SB 490 (2023): itemized bill before collections", url: "https://www.forvismazars.us/alert/2023/07/texas-medical-billing-transparency-law-takes-effect-sept-1" },
  fap: { label: "IRS: nonprofit hospital financial assistance, Section 501(r)(4)", url: "https://www.irs.gov/charities-non-profits/financial-assistance-policy-and-emergency-medical-care-policy-section-501r4" },
  eca: { label: "IRS: billing and collections limits, Section 501(r)(6)", url: "https://www.irs.gov/charities-non-profits/billing-and-collections-section-501r6" },
  gfe: { label: "CMS: dispute a bill that is $400+ over your Good Faith Estimate", url: "https://www.cms.gov/nosurprises/consumers/medical-bill-rights" },
  nsa: { label: "CMS: No Surprises Act protections against surprise bills", url: "https://www.cms.gov/nosurprises" },
  appeal: { label: "HealthCare.gov: appealing a health plan decision", url: "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/" },
  fdcpa: { label: "CFPB: how to dispute a debt with a debt collector", url: "https://www.consumerfinance.gov/ask-cfpb/how-do-i-dispute-a-debt-en-1695/" },
};

const DAY = 86400000;
export function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  return new Date(d.getTime() + n * DAY).toISOString().slice(0, 10);
}
export function daysLeft(iso, today) {
  return Math.round((new Date(iso + "T12:00:00") - new Date(today + "T12:00:00")) / DAY);
}

/**
 * a = { state, setting: "hospital"|"er"|"doctor"|"other", insured: bool, amount: number, billDate: "YYYY-MM-DD"|"",
 *       itemized: bool, nonprofit: "yes"|"no"|"unsure", gfe: bool, gfeAmount: number, surprise: "yes"|"no"|"unsure",
 *       denied: bool, collections: bool }
 * returns rights sorted: open deadlines soonest first, then the rest.
 */
export function rightsFor(a, today = new Date().toISOString().slice(0, 10)) {
  const out = [];
  const hospital = a.setting === "hospital" || a.setting === "er";
  const tx = (a.state || "").toUpperCase() === "TX";
  const dl = (days) => (a.billDate ? addDays(a.billDate, days) : null);

  out.push({
    id: "itemized", letter: "itemized", priority: 1,
    title: "Get the itemized bill and your billing records",
    why: a.itemized ? "You have it. Check every line against what actually happened." :
      "A summary bill hides the line items where most mistakes live. You have a federal right to your billing records." +
      (tx ? " In Texas, the provider must give you an itemized bill before sending you to collections." : ""),
    action: a.itemized ? "Use the line checker below." : "Send the request letter. Providers generally have 30 days to respond.",
    deadline: null, sources: tx ? [SOURCES.hipaa, SOURCES.tx490] : [SOURCES.hipaa],
  });

  if (hospital && a.nonprofit !== "no") {
    out.push({
      id: "fap", letter: "fap", priority: 2,
      title: "Ask for financial assistance (charity care)",
      why: (a.nonprofit === "unsure" ? "Most US hospitals are nonprofits. If this one is, " : "Because this hospital is a nonprofit, ") +
        "it must have a written financial assistance policy, and if you qualify it cannot charge you more than it generally bills insured patients. Eligibility is set by each hospital and is often wider than people expect, so apply even if you have insurance or think you earn too much.",
      action: "Ask for the application and the plain-language summary, and ask them to hold collections while you apply.",
      deadline: dl(240), deadlineLabel: "Application window (240 days from the first bill after discharge)",
      sources: [SOURCES.fap, SOURCES.eca],
    });
  }

  if (!a.insured && a.gfe && a.amount - (a.gfeAmount || 0) >= 400) {
    out.push({
      id: "gfe", letter: "gfe", priority: 0,
      title: `Dispute the bill: it is $${Math.round(a.amount - a.gfeAmount).toLocaleString()} over your Good Faith Estimate`,
      why: "If you were uninsured or paid yourself, and the bill is at least $400 more than the estimate you were given, you can use the federal dispute process. The fee is $25, and it comes off the bill if you win.",
      action: "File with CMS within 120 days of the bill date, and tell the provider in writing that you are disputing.",
      deadline: dl(120), deadlineLabel: "Dispute deadline (120 days from the bill date)",
      sources: [SOURCES.gfe],
    });
  } else if (!a.insured && !a.gfe) {
    out.push({
      id: "nogfe", letter: null, priority: 4,
      title: "You may have been owed a Good Faith Estimate",
      why: "Uninsured and self-pay patients have a right to a written estimate when they schedule care at least 3 business days ahead, or when they ask for one. Without one, the $400 dispute process doesn't apply, but the missing estimate is worth raising.",
      action: "Ask the provider for the estimate they should have given you, and keep it for any dispute.",
      deadline: null, sources: [SOURCES.gfe],
    });
  }

  if (a.insured && (a.surprise === "yes" || a.surprise === "unsure")) {
    out.push({
      id: "nsa", letter: "nsa", priority: 1,
      title: "Check for a banned surprise bill",
      why: "With insurance, the No Surprises Act protects you from balance bills for emergency care, for out-of-network doctors at an in-network hospital, and for air ambulances. You should owe only your normal in-network cost-sharing.",
      action: "Compare the bill to your Explanation of Benefits. If they are billing you above your in-network cost-sharing, send the letter and report it to CMS.",
      deadline: null, sources: [SOURCES.nsa],
    });
  }

  if (a.insured && a.denied) {
    out.push({
      id: "appeal", letter: null, priority: 1,
      title: "Appeal the insurance denial",
      why: "If your plan denied the claim, you can usually file an internal appeal within 180 days of the denial notice, then request an external review if they still say no.",
      action: "Ask your plan for the denial reason in writing and the appeal form. Ask the provider for a letter of medical necessity.",
      deadline: null, sources: [SOURCES.appeal],
    });
  }

  if (a.collections) {
    out.push({
      id: "collections", letter: "validation", priority: 0,
      title: "In collections: dispute it in writing",
      why: "A debt collector has to send you a validation notice. If you dispute in writing within the 30-day window it gives, collection has to stop until they verify the debt. The major credit bureaus have said they don't report medical collections under $500 or ones that were paid." +
        (tx ? " In Texas, ask whether you were given an itemized bill before it went to collections." : "") +
        (hospital && a.nonprofit !== "no" ? " A nonprofit hospital also has limits on collection actions while a financial assistance application is open." : ""),
      action: "Send the dispute letter, then keep paying nothing on this debt until it is verified.",
      deadline: null, sources: [SOURCES.fdcpa].concat(hospital && a.nonprofit !== "no" ? [SOURCES.eca] : []),
    });
  }

  for (const r of out) r.daysLeft = r.deadline ? daysLeft(r.deadline, today) : null;
  return out.sort((x, y) => {
    const ax = x.daysLeft ?? 1e6, ay = y.daysLeft ?? 1e6;
    return ax !== ay ? ax - ay : x.priority - y.priority;
  });
}

/** lines = [{date, code, desc, qty, amount}] -> findings about exact repeats and big single lines. */
export function checkLines(lines) {
  const seen = new Map(), findings = [];
  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  lines.forEach((l, i) => {
    const key = [l.date, (l.code || "").trim().toUpperCase(), (l.desc || "").trim().toLowerCase(), Number(l.amount)].join("|");
    if (seen.has(key)) findings.push({ line: i, kind: "duplicate", note: `Same item, date and amount as line ${seen.get(key) + 1}. Ask whether you received it twice.` });
    else seen.set(key, i);
    if (Number(l.qty) > 1) findings.push({ line: i, kind: "quantity", note: `Quantity ${l.qty}. Check that you received it that many times.` });
    if (total > 0 && Number(l.amount) / total > 0.4 && lines.length > 2) findings.push({ line: i, kind: "large", note: "This one line is over 40% of the bill. Ask what it covers and for the hospital's posted cash price for it." });
  });
  return { total, findings };
}
