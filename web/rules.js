// rules.js: which patient billing rights apply, with deadlines and sources. Pure function, runs in the browser.
// Every right cites the public rule it comes from. This is self-help information, not legal advice.
// Corrected 2026-10-13 after a teardown against CMS, NY AG, CA HCAI, WA RCW, CO AG, MD HSCRC and Texas statute.
// Languages: en, es (Spanish terms follow CMS's own Spanish pages: "estimación de buena fe", "Ley Sin Sorpresas").

export const SOURCES = {
  hipaa: { label: "HHS: your right to access your health and billing records (45 CFR 164.524)", url: "https://www.hhs.gov/hipaa/for-individuals/right-to-access/index.html" },
  tx185: { label: "Texas Health and Safety Code 185.002: itemized bill before collections", url: "https://texas.public.law/statutes/tex._health_and_safety_code_section_185.002" },
  fap: { label: "IRS: nonprofit hospital financial assistance, Section 501(r)(4)", url: "https://www.irs.gov/charities-non-profits/financial-assistance-policy-and-emergency-medical-care-policy-section-501r4" },
  eca: { label: "IRS: billing and collections limits, Section 501(r)(6)", url: "https://www.irs.gov/charities-non-profits/billing-and-collections-section-501r6" },
  gfe: { label: "CMS: dispute a bill that is $400 or more over your Good Faith Estimate", url: "https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/get-help/dispute-bill" },
  portal: { label: "CMS patient-provider dispute portal", url: "https://nsa-idr.cms.gov/billdisputes/s/" },
  rights: { label: "CMS: medical bill rights (help line 1-800-985-3059)", url: "https://www.cms.gov/medical-bill-rights" },
  rights_es: { label: "CMS: derechos sobre facturas médicas, en español (línea de ayuda 1-800-985-3059)", url: "https://www.cms.gov/es/medical-bill-rights" },
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

// Every sentence the cards use, by language. Keep the two lists in the same order so a missing key is obvious.
export const STR = {
  en: {
    itemized_t: "Get the itemized bill and your billing records",
    itemized_have: "You have it. Check every line against what actually happened.",
    itemized_why: "A summary bill hides the line items where most mistakes live. You have a federal right to your billing records.",
    itemized_tx: " In Texas, a hospital must send an itemized bill before it can send you to collections, and possibly doctors' offices too.",
    itemized_act_have: "Use the line checker below.",
    itemized_act: "Send the request letter. Providers generally have 30 days to respond.",
    state_t: "Ask for financial assistance: your state requires it",
    state_fed: " Federal nonprofit rules add to this: the hospital must have a written policy and cannot charge eligible patients more than it generally bills insured patients.",
    state_act: "Ask for the financial assistance application and the plain-language summary, apply even if you have insurance or think you earn too much, and ask them to hold collections while you apply.",
    window: "Federal window (240 days from the first bill). Apply anyway if it has passed.",
    gov_t: "Ask about the hospital's own charity care program",
    gov_why: "This is a public hospital, so the IRS nonprofit rules don't apply to it. Most public hospitals run their own financial assistance program, often with wider eligibility than private hospitals, and some states require one.",
    gov_act: "Ask for the financial assistance application and ask them to hold collections while you apply.",
    fap_t: "Ask for financial assistance (charity care)",
    fap_unsure: "Most US hospitals are nonprofits. If this one is, ",
    fap_yes: "Because this hospital is a nonprofit, ",
    fap_why: "it must have a written financial assistance policy, and if you qualify it cannot charge you more than it generally bills insured patients. Eligibility is set by each hospital and is often wider than people expect, so apply even if you have insurance or think you earn too much.",
    fap_act: "Ask for the application and the plain-language summary, and ask them to hold collections while you apply.",
    forprofit_t: "Ask anyway about financial assistance",
    forprofit_why: "A for-profit hospital has no federal duty to offer charity care, and your state has no law requiring it that we track. Many still have a discount or hardship program, and it costs nothing to ask.",
    forprofit_act: "Ask the billing office whether they have a financial assistance or self-pay discount program.",
    gfe_t: (over) => `Dispute the bill: it is $${over} over your Good Faith Estimate`,
    gfe_why: "If you were uninsured or paid yourself, got a written estimate at least 3 business days before care, and one provider's bill is at least $400 more than that provider's estimate, you can use the federal dispute process. It costs $25, refunded off the bill if you win.",
    gfe_protect: " While the dispute is pending, the provider cannot send the bill to collections, threaten to, charge late fees, or retaliate, and any settlement must cut the bill by at least $12.50.",
    gfe_late: " You said the estimate came less than 3 business days before care, so this process may not be open to you; the letter is still worth sending.",
    gfe_act: "File in the CMS dispute portal within 120 days of the bill date (have the estimate, the bill and the provider's contact; the portal times out after 15 minutes, and never mail originals). Tell the provider in writing that you are disputing.",
    gfe_dl: "Dispute deadline (120 days from the bill date)",
    nogfe_t: "You may have been owed a Good Faith Estimate",
    nogfe_why: "Uninsured and self-pay patients have a right to a written estimate when they schedule care at least 3 business days ahead, or when they ask for one. Without one, the $400 dispute process doesn't apply, but the missing estimate is worth raising, and the CMS help line can tell you what else applies.",
    nogfe_act: "Ask the provider for the estimate they should have given you, and keep it for any dispute.",
    nsa_t: "Check for a banned surprise bill",
    nsa_why: "With insurance, the No Surprises Act protects you from balance bills for emergency care, for out-of-network doctors at an in-network hospital, and for air ambulances. You should owe only your normal in-network cost-sharing.",
    nsa_act: "Compare the bill to your Explanation of Benefits. If they are billing you above your in-network cost-sharing, send the letter and file a complaint with CMS or call 1-800-985-3059.",
    appeal_t: "Appeal the insurance denial",
    appeal_why: "If your plan denied the claim, you can usually file an internal appeal within 180 days of the denial notice, then request an external review if they still say no.",
    appeal_act: "Ask your plan for the denial reason in writing and the appeal form. Ask the provider for a letter of medical necessity.",
    coll_t: "In collections: dispute it in writing",
    coll_why: "A debt collector has to send you a validation notice. If you dispute in writing within the 30-day window it gives, collection has to stop until they verify the debt. The three big credit bureaus say, as their own policy, that they don't report medical collections under $500 or ones that were paid, and your state may go further.",
    coll_tx: " In Texas, ask whether the hospital gave you an itemized bill before this went to collections; it was required to.",
    coll_np: " A nonprofit hospital also has limits on collection actions while a financial assistance application is open.",
    coll_act: "Send the dispute letter, then pay nothing on this debt until it is verified.",
    dup: (n) => `Same item, date and amount as line ${n}. Ask whether you received it twice.`,
    qty: (q) => `Quantity ${q}. Some items are correctly billed in multiples; ask what each unit was and whether you received that many.`,
    large: "This one line is over 40% of the bill. Ask what it covers and for the hospital's posted cash price for it.",
  },
  es: {
    itemized_t: "Pida la factura detallada y sus registros de facturación",
    itemized_have: "Ya la tiene. Revise cada línea contra lo que realmente ocurrió.",
    itemized_why: "Una factura resumida esconde las líneas donde están la mayoría de los errores. Usted tiene el derecho federal de acceder a sus registros de facturación.",
    itemized_tx: " En Texas, un hospital debe enviarle una factura detallada antes de mandar su cuenta a cobranza, y posiblemente los consultorios médicos también.",
    itemized_act_have: "Use el revisor de líneas más abajo.",
    itemized_act: "Envíe la carta de solicitud. Por lo general tienen 30 días para responder.",
    state_t: "Pida asistencia financiera: la ley de su estado lo exige",
    state_fed: " Las reglas federales para hospitales sin fines de lucro se suman: el hospital debe tener una política escrita y no puede cobrarle a los pacientes que califican más de lo que normalmente cobra a los pacientes con seguro.",
    state_act: "Pida la solicitud de asistencia financiera y el resumen en lenguaje sencillo, solicítela aunque tenga seguro o crea que gana demasiado, y pida que detengan la cobranza mientras la revisan.",
    window: "Plazo federal (240 días desde la primera factura). Solicítela de todos modos si ya pasó.",
    gov_t: "Pregunte por el programa de atención de caridad del propio hospital",
    gov_why: "Este es un hospital público, así que las reglas del IRS para hospitales sin fines de lucro no le aplican. La mayoría de los hospitales públicos tienen su propio programa de asistencia financiera, muchas veces con requisitos más amplios que los hospitales privados, y algunos estados lo exigen.",
    gov_act: "Pida la solicitud de asistencia financiera y pida que detengan la cobranza mientras la revisan.",
    fap_t: "Pida asistencia financiera (atención de caridad)",
    fap_unsure: "La mayoría de los hospitales en EE. UU. son sin fines de lucro. Si este lo es, ",
    fap_yes: "Como este hospital es sin fines de lucro, ",
    fap_why: "debe tener una política escrita de asistencia financiera, y si usted califica no puede cobrarle más de lo que normalmente cobra a los pacientes con seguro. Cada hospital fija sus requisitos, que suelen ser más amplios de lo que la gente cree, así que solicítela aunque tenga seguro o crea que gana demasiado.",
    fap_act: "Pida la solicitud y el resumen en lenguaje sencillo, y pida que detengan la cobranza mientras la revisan.",
    forprofit_t: "Pregunte de todos modos por asistencia financiera",
    forprofit_why: "Un hospital con fines de lucro no tiene obligación federal de ofrecer atención de caridad, y su estado no tiene una ley que la exija de las que seguimos. Muchos tienen igual un programa de descuento o de dificultad económica, y preguntar no cuesta nada.",
    forprofit_act: "Pregunte en la oficina de facturación si tienen un programa de asistencia financiera o de descuento por pago directo.",
    gfe_t: (over) => `Dispute la factura: supera por $${over} su estimación de buena fe`,
    gfe_why: "Si no tenía seguro o pagó por su cuenta, recibió una estimación por escrito al menos 3 días hábiles antes de la atención, y la factura de un proveedor es al menos $400 mayor que la estimación de ese mismo proveedor, puede usar el proceso federal de disputa. Cuesta $25, que se descuentan de la factura si usted gana.",
    gfe_protect: " Mientras la disputa está pendiente, el proveedor no puede mandar la factura a cobranza, amenazar con hacerlo, cobrar recargos por mora ni tomar represalias, y cualquier acuerdo debe reducir la factura al menos $12.50.",
    gfe_late: " Usted indicó que la estimación llegó con menos de 3 días hábiles de anticipación, así que este proceso quizá no esté disponible; aun así vale la pena enviar la carta.",
    gfe_act: "Presente la disputa en el portal de CMS dentro de los 120 días desde la fecha de la factura (tenga a mano la estimación, la factura y el contacto del proveedor; el portal se cierra a los 15 minutos de inactividad, y nunca envíe originales por correo). Avise al proveedor por escrito que está disputando.",
    gfe_dl: "Fecha límite para disputar (120 días desde la fecha de la factura)",
    nogfe_t: "Es posible que le debieran una estimación de buena fe",
    nogfe_why: "Los pacientes sin seguro o que pagan por su cuenta tienen derecho a una estimación por escrito cuando programan la atención con al menos 3 días hábiles de anticipación, o cuando la piden. Sin ella no aplica el proceso de disputa de $400, pero vale la pena reclamar la estimación que faltó, y la línea de ayuda de CMS puede decirle qué más aplica.",
    nogfe_act: "Pida al proveedor la estimación que debió darle y guárdela para cualquier disputa.",
    nsa_t: "Revise si es una factura sorpresa prohibida",
    nsa_why: "Con seguro, la Ley Sin Sorpresas lo protege de facturas por saldo en atención de emergencia, por médicos fuera de la red en un hospital dentro de la red, y por ambulancia aérea. Solo debería pagar su costo compartido normal dentro de la red.",
    nsa_act: "Compare la factura con su Explicación de beneficios (EOB). Si le cobran más que su costo compartido dentro de la red, envíe la carta y presente una queja ante CMS o llame al 1-800-985-3059.",
    appeal_t: "Apele la negación del seguro",
    appeal_why: "Si su plan negó la reclamación, por lo general puede presentar una apelación interna dentro de los 180 días desde el aviso de negación, y luego pedir una revisión externa si siguen diciendo que no.",
    appeal_act: "Pida a su plan el motivo de la negación por escrito y el formulario de apelación. Pida al proveedor una carta de necesidad médica.",
    coll_t: "En cobranza: dispútela por escrito",
    coll_why: "Una agencia de cobro debe enviarle un aviso de validación. Si usted disputa por escrito dentro de los 30 días que indica, la cobranza debe detenerse hasta que verifiquen la deuda. Las tres grandes agencias de crédito dicen, como política propia, que no reportan cobranzas médicas menores de $500 ni las que ya se pagaron, y su estado puede ir más lejos.",
    coll_tx: " En Texas, pregunte si el hospital le dio una factura detallada antes de mandar la cuenta a cobranza; estaba obligado a hacerlo.",
    coll_np: " Un hospital sin fines de lucro también tiene límites en las acciones de cobro mientras una solicitud de asistencia financiera está abierta.",
    coll_act: "Envíe la carta de disputa y no pague nada de esta deuda hasta que la verifiquen.",
    dup: (n) => `Mismo artículo, fecha y monto que la línea ${n}. Pregunte si lo recibió dos veces.`,
    qty: (q) => `Cantidad ${q}. Algunos artículos se cobran correctamente en múltiplos; pregunte qué fue cada unidad y si recibió esa cantidad.`,
    large: "Esta sola línea es más del 40% de la factura. Pregunte qué cubre y cuál es el precio de contado publicado por el hospital.",
  },
};

// State charity-care laws that apply to hospitals regardless of nonprofit status. Thresholds are from the sources above;
// confirm the current figures with the state before relying on an exact number.
export const STATE_CHARITY = {
  CA: { deadline: false, src: SOURCES.ca,
    en: "California's Hospital Fair Pricing Act requires hospitals to offer free or discounted care to patients with income up to 400% of the federal poverty level, whatever the hospital's tax status, and bars denying an application because of when you applied.",
    es: "La Ley de Precios Justos Hospitalarios de California exige que los hospitales ofrezcan atención gratuita o con descuento a pacientes con ingresos de hasta el 400% del nivel federal de pobreza, sin importar si el hospital es con o sin fines de lucro, y prohíbe negar una solicitud por la fecha en que se presentó." },
  NY: { deadline: false, src: SOURCES.ny,
    en: "New York requires every hospital to offer financial assistance up to 400% of the federal poverty level: charges are waived under 200%, capped above that, payment plans are limited to 5% of monthly income, there is no application deadline, and the hospital must decide within 30 days.",
    es: "Nueva York exige que todo hospital ofrezca asistencia financiera hasta el 400% del nivel federal de pobreza: los cargos se condonan por debajo del 200%, se limitan por encima, los planes de pago no pueden superar el 5% del ingreso mensual, no hay fecha límite para solicitar, y el hospital debe decidir en 30 días." },
  WA: { deadline: true, src: SOURCES.wa,
    en: "Washington requires hospitals to give charity care: at large hospital systems, full charity care up to 300% of the federal poverty level and discounts up to 400%. Smaller hospitals have their own tiers.",
    es: "Washington exige que los hospitales den atención de caridad: en los sistemas hospitalarios grandes, atención gratuita hasta el 300% del nivel federal de pobreza y descuentos hasta el 400%. Los hospitales más pequeños tienen sus propios niveles." },
  CO: { deadline: true, src: SOURCES.co,
    en: "Colorado requires hospitals to offer discounted care to patients at or below 250% of the federal poverty level and to screen you for it, with 30 days' notice before any collection action.",
    es: "Colorado exige que los hospitales ofrezcan atención con descuento a pacientes con ingresos de hasta el 250% del nivel federal de pobreza y que evalúen si usted califica, con 30 días de aviso antes de cualquier acción de cobro." },
  MD: { deadline: true, src: SOURCES.md,
    en: "Maryland requires hospitals to give free care at or below 200% of the federal poverty level and reduced-cost care for financial hardship up to 500%.",
    es: "Maryland exige que los hospitales den atención gratuita a pacientes con ingresos de hasta el 200% del nivel federal de pobreza y atención a costo reducido por dificultad económica hasta el 500%." },
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
export function rightsFor(a, today = new Date().toISOString().slice(0, 10), lang = "en") {
  const t = STR[lang] || STR.en;
  const out = [];
  const st = (a.state || "").toUpperCase();
  const hospital = a.setting === "hospital" || a.setting === "er";
  const tx = st === "TX";
  const dl = (days) => (a.billDate ? addDays(a.billDate, days) : null);
  const rightsSrc = lang === "es" ? SOURCES.rights_es : SOURCES.rights;

  out.push({
    id: "itemized", letter: "itemized", priority: 1,
    title: t.itemized_t,
    why: a.itemized ? t.itemized_have : t.itemized_why + (tx ? t.itemized_tx : ""),
    action: a.itemized ? t.itemized_act_have : t.itemized_act,
    deadline: null, sources: tx ? [SOURCES.hipaa, SOURCES.tx185] : [SOURCES.hipaa],
  });

  const stateLaw = hospital ? STATE_CHARITY[st] : null;
  if (stateLaw) {
    out.push({
      id: "fap", letter: "fap", priority: 2,
      title: t.state_t,
      why: (stateLaw[lang] || stateLaw.en) + (a.nonprofit === "yes" || a.nonprofit === "unsure" ? t.state_fed : ""),
      action: t.state_act,
      deadline: stateLaw.deadline ? dl(240) : null, soft: true, deadlineLabel: t.window,
      sources: [stateLaw.src].concat(a.nonprofit === "no" ? [] : [SOURCES.fap, SOURCES.eca]),
    });
  } else if (hospital && a.nonprofit === "government") {
    out.push({ id: "fap", letter: "fap", priority: 2, title: t.gov_t, why: t.gov_why, action: t.gov_act, deadline: null, sources: [SOURCES.kff] });
  } else if (hospital && a.nonprofit !== "no") {
    out.push({
      id: "fap", letter: "fap", priority: 2,
      title: t.fap_t,
      why: (a.nonprofit === "unsure" ? t.fap_unsure : t.fap_yes) + t.fap_why,
      action: t.fap_act,
      deadline: dl(240), soft: true, deadlineLabel: t.window,
      sources: [SOURCES.fap, SOURCES.eca],
    });
  } else if (hospital && a.nonprofit === "no") {
    out.push({ id: "fap", letter: "fap", priority: 3, title: t.forprofit_t, why: t.forprofit_why, action: t.forprofit_act, deadline: null, sources: [SOURCES.kff] });
  }

  const over = a.amount - (a.gfeAmount || 0);
  if (!a.insured && a.gfe && over >= 400) {
    const ok = a.gfeEarly !== false;
    out.push({
      id: "gfe", letter: "gfe", priority: 0,
      title: t.gfe_t(Math.round(over).toLocaleString()),
      why: t.gfe_why + t.gfe_protect + (ok ? "" : t.gfe_late),
      action: t.gfe_act,
      deadline: dl(120), deadlineLabel: t.gfe_dl,
      sources: [SOURCES.gfe, SOURCES.portal],
    });
  } else if (!a.insured && !a.gfe) {
    out.push({ id: "nogfe", letter: null, priority: 4, title: t.nogfe_t, why: t.nogfe_why, action: t.nogfe_act, deadline: null, sources: [SOURCES.gfe, rightsSrc] });
  }

  if (a.insured && (a.surprise === "yes" || a.surprise === "unsure")) {
    out.push({ id: "nsa", letter: "nsa", priority: 1, title: t.nsa_t, why: t.nsa_why, action: t.nsa_act, deadline: null, sources: [rightsSrc] });
  }

  if (a.insured && a.denied) {
    out.push({ id: "appeal", letter: null, priority: 1, title: t.appeal_t, why: t.appeal_why, action: t.appeal_act, deadline: null, sources: [SOURCES.appeal] });
  }

  if (a.collections) {
    out.push({
      id: "collections", letter: "validation", priority: 0,
      title: t.coll_t,
      why: t.coll_why + (tx ? t.coll_tx : "") + (hospital && a.nonprofit !== "no" ? t.coll_np : ""),
      action: t.coll_act,
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
export function checkLines(lines, lang = "en") {
  const t = STR[lang] || STR.en;
  const seen = new Map(), findings = [];
  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  lines.forEach((l, i) => {
    const key = [l.date, (l.code || "").trim().toUpperCase(), (l.desc || "").trim().toLowerCase(), Number(l.amount)].join("|");
    if (seen.has(key)) findings.push({ line: i, kind: "duplicate", note: t.dup(seen.get(key) + 1) });
    else seen.set(key, i);
    if (Number(l.qty) > 1) findings.push({ line: i, kind: "quantity", note: t.qty(l.qty) });
    if (total > 0 && Number(l.amount) / total > 0.4 && lines.length > 2) findings.push({ line: i, kind: "large", note: t.large });
  });
  return { total, findings };
}
