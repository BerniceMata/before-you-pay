// letters.js: plain self-help letters. The patient fills in the blanks and sends it themselves.
// Nothing here is legal advice, and nothing leaves the browser.

const blank = (v, label) => (v && String(v).trim()) || `[${label}]`;
const money = (v, label) => (Number(v) > 0 ? Number(v).toLocaleString("en-US") : `[${label}]`);

const longDate = (iso) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? new Date(iso + "T12:00:00") : null;
  return d && !isNaN(d) ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
};

export function letter(id, f, extra = {}) {
  // a debt validation letter goes to the collector, not the hospital; every other letter goes to the provider
  const toCollector = id === "validation";
  const to = toCollector
    ? `${blank(f.collector, "Collection agency name")}
${blank(f.collectorAddress, "Collection agency address")}`
    : `${blank(f.provider, "Hospital or provider name")}
Billing Department
${blank(f.providerAddress, "Billing address from your bill")}`;
  const head = `${blank(f.name, "Your full name")}
${blank(f.address, "Your mailing address")}
${blank(f.today, "Date")}

${to}

Re: Account ${blank(f.account, "Account number")}, patient ${blank(f.patient || f.name, "Patient name")}, date(s) of service ${blank(f.serviceDate, "Date of service")}${toCollector ? `
Original creditor: ${blank(f.provider, "Hospital or provider name")}` : ""}

`;
  const close = `
Please reply in writing to the address above. Thank you.

Sincerely,
${blank(f.name, "Your full name")}
`;
  const hold = "While this request is open, please place the account on hold and do not send it to collections or report it to a credit bureau.";
  const L = {
    itemized: `To the billing department:

I am requesting a complete itemized bill for the account above, showing each item and service with its date, billing code, quantity and charge, along with any payments, adjustments and insurance payments applied. I am also requesting a copy of my billing records under my right of access (45 CFR 164.524).${f.state === "TX" ? "\n\nI understand that Texas law requires an itemized bill to be provided before an account is sent to collections." : ""}

${hold}`,
    fap: `To the billing department:

I would like to apply for financial assistance for the account above. Please send me your financial assistance policy, the plain-language summary, and the application form, or tell me where to find them.

Please also tell me the amounts generally billed for my care, and apply any assistance I qualify for to this account, including amounts I may already have paid.

${hold}`,
    gfe: `To the billing department:

I received a Good Faith Estimate of $${money(extra.gfeAmount, "estimate amount")} for this care. The bill I received is $${money(extra.amount, "bill amount")}, which is at least $400 more than the estimate. I am disputing this bill through the federal patient-provider dispute resolution process, and I am filing with the Centers for Medicare & Medicaid Services within 120 days of the bill date.

While the dispute is pending, federal rules bar sending this bill to collections, threatening to, charging late fees, or taking any retaliatory action, and I expect those protections to be honored. If you would like to settle before a decision, please contact me in writing.`,
    nsa: `To the billing department:

I am writing about a bill for care I believe is protected by the federal No Surprises Act: ${blank(extra.reason, "emergency care / an out-of-network provider at an in-network facility / air ambulance")}. Under the Act, I should owe only my in-network cost-sharing, as shown on my health plan's Explanation of Benefits.

Please correct the bill to my in-network cost-sharing amount and send me the corrected bill. ${hold}`,
    validation: `To whom it may concern:

${longDate(f.collectorNotice) ? `Your first notice about this debt is dated ${longDate(f.collectorNotice)}. ` : ""}I am disputing the debt you are trying to collect for the account above. Please provide verification of this debt, including the name of the original creditor, an itemized statement of the amount, and proof that you are authorized to collect it.

Please stop collection activity until you have sent this verification. Please do not report this debt to any credit bureau while it is disputed.`,
    errors: `To the billing department:

I reviewed the itemized bill for the account above and I am disputing these charges:

${(extra.disputed || []).map((l, i) => `${i + 1}. ${l.date || ""} ${l.code || ""} ${l.desc || ""}, $${Number(l.amount || 0).toLocaleString("en-US")}: ${l.ask || "please explain this charge or remove it"}`).join("\n") || "[List each charge you are disputing and why]"}

Please review these charges, send me a corrected bill, and explain any charge you keep. ${hold}`,
  };
  return head + L[id] + close;
}

export const LETTER_NAMES = {
  itemized: "Itemized bill and records request", fap: "Financial assistance request", gfe: "Good Faith Estimate dispute notice",
  nsa: "Surprise bill (No Surprises Act) letter", validation: "Debt validation and dispute letter", errors: "Billing error dispute",
};
