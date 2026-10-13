# Before You Pay

A free medical bill rights checker. Answer a few questions and see which US patient billing rights apply to you, how many days you have left on each, and get the letter to send. It runs entirely in the browser: nothing you type leaves your device.

Live: https://mitchloveswords.com/bill

## What it covers
- **Itemized bill and billing records:** your HIPAA right of access (45 CFR 164.524), plus Texas Health and Safety Code 185.002 (itemized bill before collections).
- **Hospital financial assistance:** IRS Section 501(r) rules for nonprofit hospitals, and state laws that apply to every hospital regardless of tax status in California, New York, Washington, Colorado and Maryland. Public hospitals get their own card. For-profit hospitals elsewhere get "ask anyway".
- **The Good Faith Estimate dispute:** uninsured or self-pay, estimate at least 3 business days before care, one provider's bill at least $400 over that provider's estimate, filed within 120 days. The card states the protections while a dispute is pending and links the CMS portal.
- **Surprise bills** for insured patients under the No Surprises Act.
- **Insurance denial appeals.**
- **Debt validation** when a bill is in collections (FDCPA).
- **A line checker** for the itemized bill: exact duplicates, quantities above one, and any single line that is most of the bill, which can be dropped into a dispute letter.

The hospital question is answered for you from the CMS Hospital General Information dataset (5,419 Medicare hospitals), split per state in `web/hospitals/` and loaded on the page. Rebuild with `python build_hospitals.py` after downloading the CSV from https://data.cms.gov/provider-data/dataset/xubh-q36u.

## How it stays honest
- Every right cites its public source, shown on the card.
- Deadlines that are federal floors (the 240-day financial assistance window) are marked soft and never shown as "missed", because hospitals accept late applications and some states forbid deadlines.
- Letters leave visible blanks instead of inventing details.
- Before launch the rules were checked against CMS, state attorney general and statute pages. That review found eight errors, all fixed in commit 2 (see `test/rules.test.mjs` for the cases).
- Usage is counted as anonymous events (questions answered, letter opened, copied, downloaded). No answers, no personal data.

## Run
```
node --test          # 14 tests, no network
python -m http.server --directory web 8000
```

## Not legal advice
Self-help information only. State rules change; check the cited source, and talk to a patient advocate or an attorney for a large or complex bill. Never paste CPT code descriptions into this tool's output: they are licensed by the AMA.

## License
MIT. Use it, fork it, improve it. If you add a state, cite the statute.
