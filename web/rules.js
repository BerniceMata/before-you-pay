// rules.js: which patient billing rights apply, with deadlines and sources. Pure function, runs in the browser.
// Every right cites the public rule it comes from. This is self-help information, not legal advice.
// Corrected 2026-10-13 after a teardown against CMS, NY AG, CA HCAI, WA RCW, CO AG, MD HSCRC and Texas statute.

export const SOURCES = {
  hipaa: { label: "HHS: your right to access your health and billing records (45 CFR 164.524)", url: "https://www.hhs.gov/hipaa/for-individuals/right-to-access/index.html" },
  tx185: { label: "Texas Health and Safety Code 185.002: itemized bill before collections", url: "https://texas.public.law/statutes/tex._health_and_safety_code_section_185.002" },
  fap: { label: "IRS: nonprofit hospital financial assistance, Section 501(r)(4)", url: "https://www.irs.gov/charities-non-profits/financial-assistance-policy-and-emergency-medical-care-policy-section-501r4" },
  eca: { label: "IRS: billing and collections limits, Section 501(r)(6)", url: "https://www.irs.gov/charities-non-profits/billing-and-collections-section-501r6" },
  gfe: { label: "CMS: dispute a bill that is $400 or more over your Good Faith Estimate", url: "https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/get-help/dispute-bill" },
  portal: { label: "CMS patient-provider dispute portal", url: "https://nsa-idr.cms.gov/billdisputes/s/" },
  rights: { label: "CMS: medical bill rights (help line 1-800-985-3059)", url: "https://www.cms.gov/medical-bill-rights" },
  appeal: { label: "HealthCare.gov: appealing a health plan decision", url: "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/" },
  kff: { label: "KFF: hospital charity care, how it works and why it matters", url: "https://www.kff.org/health-costs/hospital-charity-care-how-it-works-and-why-it-matters/" },
  cms_hosp: { label: "CMS Hospital General Information dataset (ownership type)", url: "https://data.cms.gov/provider-data/dataset/xubh-q36u" },
  fdcpa: { label: "CFPB: how to dispute a debt with a debt collector", url: "https://www.consumerfinance.gov/ask-cfpb/how-do-i-dispute-a-debt-en-1695/" },
  ca: { label: "California HCAI: Hospital Fair Pricing Act (charity care up to 400% of the poverty level)", url: "https://hcai.ca.gov/data-and-reports/hospital-fair-pricing/" },
  ny: { label: "New York Attorney General: hospital financial assistance (up to 400% of the poverty level, no application deadline)", url: "https://ag.ny.gov/resources/individuals/health-care-insurance/hospital-financial-assistance" },
  wa: { label: "Washington RCW 70.170.060: charity care", url: "https://law.justia.com/codes/washington/title-70/chapter-70-170/section-70-170-060" },
  co: { label: "Colorado Attorney General: hospital discounted care notice (HB21-1198)", url: "https://coag.gov/app/uploads/2022/08/HB-22-1403-Notice-Healthcare-Billing-Requirements-for-Indigent-Patients.pdf" },
  md: { label: "Maryland Health-General 19-214.1: free and reduced-cost care", url: "https://mgaleg.maryland.gov/2026RS/Statute_Web/ghg/19-214.1.pdf" },
};

// State charity-care laws that apply to hospitals regardless of nonprofit status. Thresholds are from the sources above;
// confirm the current figures with the state before relying on an exact number.
export const STATE_CHARITY = {
  CA: { rule: "California's Hospital Fair Pricing Act requires hospitals to offer free or discounted care to patients with income up to 400% of the federal poverty level, whatever the hospital's tax status, and bars denying an application because of when you applied.", deadline: false, src: SOURCES.ca },
  NY: { rule: "New York requires every hospital to offer financial assistance up to 400% of the federal poverty level: charges are waived under 200%, capped above that, payment plans are limited to 5% of monthly income, there is no application deadline, and the hospital must decide within 30 days.", deadline: false, src: SOURCES.ny },
  WA: { rule: "Washington requires hospitals to give charity care: at large hospital systems, full charity care up to 300% of the federal poverty level and discounts up to 400%. Smaller hospitals have their own tiers.", deadline: true, src: SOURCES.wa },
  CO: { rule: "Colorado requires hospitals to offer discounted care to patients at or below 250% of the federal poverty level and to screen you for it, with 30 days' notice before any collection action.", deadline: true, src: SOURCES.co },
  MD: { rule: "Maryland requires hospitals to give free care at or below 200% of the federal poverty level and reduced-cost care for financial hardship up to 500%.", deadline: true, src: SOURCES.md },
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
 *       itemized: bool, nonprofit: "yes"|"no"|"government"|"unsure", gfe: bool, gfeAmount: number, gfeEarly: bool,
 *       surprise: "yes"|"no"|"unsure", denied: bool, collections: bool }
 * returns rights sorted: open hard deadlines soonest first, then the rest. `soft` deadlines are federal floors that
 * never bar applying, so the UI must not print "missed" for them.
 */
export function rightsFor(a, today = new Date().toISOString().slice(0, 10)) {
  const out = [];
  const st = (a.state || "").toUpperCase();
  const hospital = a.setting === "hospital" || a.setting === "er";
  const tx = st === "TX";
  const dl = (days) => (a.billDate ? addDays(a.billDate, days) : null);

  out.push({
    id: "itemized", letter: "itemized", priority: 1,
    title: "Get the itemized bill and your billing records",
    why: a.itemized ? "You have it. Check every line against what actually happened." :
      "A summary bill hides the line items where most mistakes live. You have a federal right to your billing records." +
      (tx ? " In Texas, a hospital must send an itemized bill before it can send you to collections, and possibly doctors' offices too." : ""),
    action: a.itemized ? "Use the line checker below." : "Send the request letter. Providers generally have 30 days to respond.",
    deadline: null, sources: tx ? [SOURCES.hipaa, SOURCES.tx185] : [SOURCES.hipaa],
  });

  const stateLaw = hospital ? STATE_CHARITY[st] : null;
  if (stateLaw) {
    out.push({
      id: "fap", letter: "fap", priority: 2,
      title: "Ask for financial assistance: your state requires it",
      why: stateLaw.rule + (a.nonprofit === "yes" || a.nonprofit === "unsure" ? " Federal nonprofit rules add to this: the hospital must have a written policy and cannot charge eligible patients more than it generally bills insured patients." : ""),
      action: "Ask for the financial assistance application and the plain-language summary, apply even if you have insurance or think you earn too much, and ask them to hold collections while you apply.",
      deadline: stateLaw.deadline ? dl(240) : null, soft: true,
      deadlineLabel: "Federal window (240 days from the first bill). Apply anyway if it has passed.",
      sources: [stateLaw.src].concat(a.nonprofit === "no" ? [] : [SOURCES.fap, SOURCES.eca]),
    });
  } else if (hospital && a.nonprofit === "government") {
    out.push({
      id: "fap", letter: "fap", priority: 2,
      title: "Ask about the hospital's own charity care program",
      why: "This is a public hospital, so the IRS nonprofit rules don't apply to it. Most public hospitals run their own financial assistance program, often with wider eligibility than private hospitals, and some states require one.",
      action: "Ask for the financial assistance application and ask them to hold collections while you apply.",
      deadline: null, sources: [SOURCES.kff],
    });
  } else if (hospital && a.nonprofit !== "no") {
    out.push({
      id: "fap", letter: "fap", priority: 2,
      title: "Ask for financial assistance (charity care)",
      why: (a.nonprofit === "unsure" ? "Most US hospitals are nonprofits. If this one is, " : "Because this hospital is a nonprofit, ") +
        "it must have a written financial assistance policy, and if you qualify it cannot charge you more than it generally bills insured patients. Eligibility is set by each hospital and is often wider than people expect, so apply even if you have insurance or think you earn too much.",
      action: "Ask for the application and the plain-language summary, and ask them to hold collections while you apply.",
      deadline: dl(240), soft: true,
      deadlineLabel: "Federal window (240 days from the first bill). Apply anyway if it has passed.",
      sources: [SOURCES.fap, SOURCES.eca],
    });
  } else if (hospital && a.nonprofit === "no") {
    out.push({
      id: "fap", letter: "fap", priority: 3,
      title: "Ask anyway about financial assistance",
      why: "A for-profit hospital has no federal duty to offer charity care, and your state has no law requiring it that we track. Many still have a discount or hardship program, and it costs nothing to ask.",
      action: "Ask the billing office whether they have a financial assistance or self-pay discount program.",
      deadline: null, sources: [SOURCES.kff],
    });
  }

  const over = a.amount - (a.gfeAmount || 0);
  if (!a.insured && a.gfe && over >= 400) {
    const ok = a.gfeEarly !== false;
    out.push({
      id: "gfe", letter: "gfe", priority: 0,
      title: `Dispute the bill: it is $${Math.round(over).toLocaleString()} over your Good Faith Estimate`,
      why: "If you were uninsured or paid yourself, got a written estimate at least 3 business days before care, and one provider's bill is at least $400 more than that provider's estimate, you can use the federal dispute process. It costs $25, refunded off the bill if you win." +
        " While the dispute is pending, the provider cannot send the bill to collections, threaten to, charge late fees, or retaliate, and any settlement must cut the bill by at least $12.50." +
        (ok ? "" : " You said the estimate came less than 3 business days before care, so this process may not be open to you; the letter is still worth sending."),
      action: "File in the CMS dispute portal within 120 days of the bill date (have the estimate, the bill and the provider's contact; the portal times out after 15 minutes, and never mail originals). Tell the provider in writing that you are disputing.",
      deadline: dl(120), deadlineLabel: "Dispute deadline (120 days from the bill date)",
      sources: [SOURCES.gfe, SOURCES.portal],
    });
  } else if (!a.insured && !a.gfe) {
    out.push({
      id: "nogfe", letter: null, priority: 4,
      title: "You may have been owed a Good Faith Estimate",
      why: "Uninsured and self-pay patients have a right to a written estimate when they schedule care at least 3 business days ahead, or when they ask for one. Without one, the $400 dispute process doesn't apply, but the missing estimate is worth raising, and the CMS help line can tell you what else applies.",
      action: "Ask the provider for the estimate they should have given you, and keep it for any dispute.",
      deadline: null, sources: [SOURCES.gfe, SOURCES.rights],
    });
  }

  if (a.insured && (a.surprise === "yes" || a.surprise === "unsure")) {
    out.push({
      id: "nsa", letter: "nsa", priority: 1,
      title: "Check for a banned surprise bill",
      why: "With insurance, the No Surprises Act protects you from balance bills for emergency care, for out-of-network doctors at an in-network hospital, and for air ambulances. You should owe only your normal in-network cost-sharing.",
      action: "Compare the bill to your Explanation of Benefits. If they are billing you above your in-network cost-sharing, send the letter and file a complaint with CMS or call 1-800-985-3059.",
      deadline: null, sources: [SOURCES.rights],
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
      why: "A debt collector has to send you a validation notice. If you dispute in writing within the 30-day window it gives, collection has to stop until they verify the debt. The three big credit bureaus say, as their own policy, that they don't report medical collections under $500 or ones that were paid, and your state may go further." +
        (tx ? " In Texas, ask whether the hospital gave you an itemized bill before this went to collections; it was required to." : "") +
        (hospital && a.nonprofit !== "no" ? " A nonprofit hospital also has limits on collection actions while a financial assistance application is open." : ""),
      action: "Send the dispute letter, then pay nothing on this debt until it is verified.",
      deadline: null, sources: [SOURCES.fdcpa].concat(hospital && a.nonprofit !== "no" ? [SOURCES.eca] : []),
    });
  }

  for (const r of out) r.daysLeft = r.deadline ? daysLeft(r.deadline, today) : null;
  return out.sort((x, y) => {
    const hard = (r) => (r.deadline && !r.soft ? r.daysLeft : 1e6);
    return hard(x) !== hard(y) ? hard(x) - hard(y) : x.priority - y.priority;
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
    if (Number(l.qty) > 1) findings.push({ line: i, kind: "quantity", note: `Quantity ${l.qty}. Some items are correctly billed in multiples; ask what each unit was and whether you received that many.` });
    if (total > 0 && Number(l.amount) / total > 0.4 && lines.length > 2) findings.push({ line: i, kind: "large", note: "This one line is over 40% of the bill. Ask what it covers and for the hospital's posted cash price for it." });
  });
  return { total, findings };
}
