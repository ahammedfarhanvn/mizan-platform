export type ZakatInput = {
  cash: number;
  bank: number;
  gold: number;
  silver: number;
  business: number;
  receivables: number;
  investments: number;
  digitalAssets: number;
  other: number;
  liabilities: number;
  nisab: number;
  hawl: boolean;
};

export function calculateZakat(input: ZakatInput) {
  const categoryValues = {
    cash: input.cash,
    bank: input.bank,
    gold: input.gold,
    silver: input.silver,
    business: input.business,
    receivables: input.receivables,
    investments: input.investments,
    digitalAssets: input.digitalAssets,
    other: input.other,
  };
  const grossAssets = Object.values(categoryValues).reduce((sum, value) => sum + Math.max(0, value || 0), 0);
  const allowedLiabilities = Math.min(grossAssets, Math.max(0, input.liabilities || 0));
  const netZakatable = Math.max(0, grossAssets - allowedLiabilities);
  const eligible = input.hawl && input.nisab > 0 && netZakatable >= input.nisab;
  const rate = 0.025;
  const amountDue = eligible ? netZakatable * rate : 0;
  const issues: string[] = [];
  if (!input.hawl) issues.push("The ḥawl condition is not confirmed for this calculation.");
  if (input.nisab <= 0) issues.push("Enter a current niṣāb reference before relying on the result.");
  if (input.digitalAssets > 0) issues.push("Digital-asset ownership, liquidity and valuation require category review.");
  if (input.investments > 0) issues.push("Investment treatment can depend on the asset and investment intention.");
  if (input.receivables > 0) issues.push("Receivables should be reviewed for recoverability.");
  return { categoryValues, grossAssets, allowedLiabilities, netZakatable, eligible, rate, amountDue, issues };
}

export type EstateItem = { id: string; label: string; category: string; value: number; ownershipPercent: number };
export type ObligationItem = { id: string; label: string; category: string; value: number };
export type RelativeItem = {
  id: string;
  label: string;
  relationship: string;
  gender: "male" | "female" | "unspecified";
  count: number;
  aliveAtDeath: boolean;
  relationshipType: "biological" | "marital" | "adopted" | "foster" | "step" | "other";
  disputed: boolean;
};

export type FaraidInput = {
  deceasedName: string;
  deceasedGender: "male" | "female";
  dateOfDeath: string;
  country: string;
  assets: EstateItem[];
  obligations: ObligationItem[];
  bequest: number;
  relatives: RelativeItem[];
};

export type ShareRow = { label: string; relationship: string; fraction: string; percentage: number; amount: number; reason: string };

export function calculateBasicFaraid(input: FaraidInput) {
  const grossEstate = input.assets.reduce((sum, item) => sum + Math.max(0, item.value) * Math.min(100, Math.max(0, item.ownershipPercent)) / 100, 0);
  const obligations = input.obligations.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const afterObligations = Math.max(0, grossEstate - obligations);
  const bequestLimit = afterObligations / 3;
  const appliedBequest = Math.min(Math.max(0, input.bequest), bequestLimit);
  const netEstate = Math.max(0, afterObligations - appliedBequest);
  const issues: string[] = [];
  if (!input.deceasedName.trim()) issues.push("Enter the deceased person's name or a private case label.");
  if (!input.dateOfDeath) issues.push("Enter the date of death.");
  if (!input.assets.length || grossEstate <= 0) issues.push("Add at least one owned estate asset.");
  if (input.bequest > bequestLimit && input.bequest > 0) issues.push("The entered bequest exceeds one third of the estate after prior obligations and was capped for this preliminary result.");

  const active = input.relatives.filter(relative => relative.aliveAtDeath && relative.count > 0);
  const disputed = input.relatives.some(relative => relative.disputed);
  const nonStandard = active.filter(relative => !["wife", "husband", "mother", "father", "son", "daughter"].includes(relative.relationship));
  const wives = active.filter(relative => relative.relationship === "wife").reduce((sum, relative) => sum + relative.count, 0);
  const husbands = active.filter(relative => relative.relationship === "husband").reduce((sum, relative) => sum + relative.count, 0);
  const mother = active.some(relative => relative.relationship === "mother");
  const father = active.some(relative => relative.relationship === "father");
  const sons = active.filter(relative => relative.relationship === "son").reduce((sum, relative) => sum + relative.count, 0);
  const daughters = active.filter(relative => relative.relationship === "daughter").reduce((sum, relative) => sum + relative.count, 0);

  if (wives > 0 && input.deceasedGender !== "male") issues.push("A wife can only be entered for a male deceased person.");
  if (husbands > 0 && input.deceasedGender !== "female") issues.push("A husband can only be entered for a female deceased person.");
  if (wives > 0 && husbands > 0) issues.push("The case cannot contain both a surviving husband and surviving wife.");
  if (wives > 4) issues.push("More than four wives were entered; the marital relationships require review.");
  if (disputed) issues.push("One or more relationships are disputed.");
  if (nonStandard.length) issues.push("The family tree contains relationships outside the close-heir automatic pathway.");
  if (sons < 1) issues.push("Automatic distribution currently pauses when there is no surviving son because fixed-share and residuary patterns require a broader heir review.");
  if (active.some(relative => relative.relationshipType !== "biological" && !["wife", "husband"].includes(relative.relationship))) issues.push("Adopted, foster, step or other relationship entries require a qualified review.");

  const blocking = issues.some(issue => !issue.startsWith("The entered bequest"));
  const rows: ShareRow[] = [];
  if (!blocking && netEstate > 0) {
    let fixed = 0;
    if (wives) {
      fixed += 1 / 8;
      rows.push({ label: wives === 1 ? "Wife" : `${wives} wives`, relationship: "Spouse", fraction: wives === 1 ? "1/8" : "Shared 1/8", percentage: 12.5, amount: netEstate / 8, reason: "Spousal fixed share in the presence of descendants." });
    }
    if (husbands) {
      fixed += 1 / 4;
      rows.push({ label: "Husband", relationship: "Spouse", fraction: "1/4", percentage: 25, amount: netEstate / 4, reason: "Spousal fixed share in the presence of descendants." });
    }
    if (mother) {
      fixed += 1 / 6;
      rows.push({ label: "Mother", relationship: "Parent", fraction: "1/6", percentage: 100 / 6, amount: netEstate / 6, reason: "Fixed share in the presence of descendants." });
    }
    if (father) {
      fixed += 1 / 6;
      rows.push({ label: "Father", relationship: "Parent", fraction: "1/6", percentage: 100 / 6, amount: netEstate / 6, reason: "Fixed share in the presence of a male descendant." });
    }
    const residue = Math.max(0, 1 - fixed);
    const units = sons * 2 + daughters;
    const unitAmount = units ? netEstate * residue / units : 0;
    rows.push({ label: sons === 1 ? "Son" : `${sons} sons`, relationship: "Descendant", fraction: daughters ? "2 residuary units each" : "Residuary", percentage: netEstate ? unitAmount * sons * 2 / netEstate * 100 : 0, amount: unitAmount * sons * 2, reason: "Male descendants receive two residuary units for each female unit." });
    if (daughters) rows.push({ label: daughters === 1 ? "Daughter" : `${daughters} daughters`, relationship: "Descendant", fraction: "1 residuary unit each", percentage: netEstate ? unitAmount * daughters / netEstate * 100 : 0, amount: unitAmount * daughters, reason: "Female descendants share the residue with sons in a one-to-two unit ratio." });
  }
  const distributed = rows.reduce((sum, row) => sum + row.amount, 0);
  return { grossEstate, obligations, bequestLimit, appliedBequest, netEstate, supported: !blocking && netEstate > 0, issues, rows, undistributed: Math.max(0, netEstate - distributed) };
}
