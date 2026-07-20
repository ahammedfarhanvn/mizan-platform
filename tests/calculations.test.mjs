import test from "node:test";
import assert from "node:assert/strict";
import { calculateBasicFaraid, calculateZakat } from "../lib/calculations.ts";

const emptyZakat = {
  cash: 0,
  bank: 0,
  gold: 0,
  silver: 0,
  business: 0,
  receivables: 0,
  investments: 0,
  digitalAssets: 0,
  other: 0,
  liabilities: 0,
  nisab: 0,
  hawl: false,
};

test("Zakat calculation applies liabilities, nisab, hawl and the 2.5% rate", () => {
  const result = calculateZakat({ ...emptyZakat, cash: 70_000, bank: 50_000, liabilities: 20_000, nisab: 80_000, hawl: true });
  assert.equal(result.grossAssets, 120_000);
  assert.equal(result.netZakatable, 100_000);
  assert.equal(result.eligible, true);
  assert.equal(result.amountDue, 2_500);
});

test("Zakat calculation pauses below nisab or without hawl", () => {
  assert.equal(calculateZakat({ ...emptyZakat, cash: 70_000, nisab: 80_000, hawl: true }).amountDue, 0);
  assert.equal(calculateZakat({ ...emptyZakat, cash: 100_000, nisab: 80_000, hawl: false }).amountDue, 0);
});

function faraidCase(overrides = {}) {
  return {
    deceasedName: "Private case",
    deceasedGender: "male",
    dateOfDeath: "2026-01-01",
    country: "India",
    assets: [{ id: "asset-1", label: "Estate", category: "Other", value: 1_200_000, ownershipPercent: 100 }],
    obligations: [{ id: "debt-1", label: "Debt", category: "Debt", value: 200_000 }],
    bequest: 0,
    relatives: [
      { id: "wife", label: "Wife", relationship: "wife", gender: "female", count: 1, aliveAtDeath: true, relationshipType: "marital", disputed: false },
      { id: "mother", label: "Mother", relationship: "mother", gender: "female", count: 1, aliveAtDeath: true, relationshipType: "biological", disputed: false },
      { id: "father", label: "Father", relationship: "father", gender: "male", count: 1, aliveAtDeath: true, relationshipType: "biological", disputed: false },
      { id: "son", label: "Son", relationship: "son", gender: "male", count: 1, aliveAtDeath: true, relationshipType: "biological", disputed: false },
      { id: "daughter", label: "Daughter", relationship: "daughter", gender: "female", count: 1, aliveAtDeath: true, relationshipType: "biological", disputed: false },
    ],
    ...overrides,
  };
}

test("supported Farā’iḍ pathway distributes the entire net estate", () => {
  const result = calculateBasicFaraid(faraidCase());
  assert.equal(result.supported, true);
  assert.equal(result.netEstate, 1_000_000);
  assert.ok(Math.abs(result.rows.reduce((sum, row) => sum + row.amount, 0) - 1_000_000) < 0.01);
  assert.ok(result.undistributed < 0.01);
});

test("Farā’iḍ pathway pauses unsupported trees instead of guessing", () => {
  const input = faraidCase();
  input.relatives = input.relatives.filter(relative => relative.relationship !== "son");
  const result = calculateBasicFaraid(input);
  assert.equal(result.supported, false);
  assert.equal(result.rows.length, 0);
  assert.match(result.issues.join(" "), /no surviving son/i);
});

test("preliminary Farā’iḍ calculation caps an entered bequest at one third", () => {
  const input = faraidCase({ obligations: [], bequest: 500_000 });
  const result = calculateBasicFaraid(input);
  assert.equal(result.bequestLimit, 400_000);
  assert.equal(result.appliedBequest, 400_000);
  assert.equal(result.netEstate, 800_000);
});
