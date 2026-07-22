export const accountRoles = [
  "Individual",
  "Family representative",
  "Student",
  "Business owner",
  "Mahallu / institution",
  "Scholar / Qazi",
] as const;

export type AccountRole = (typeof accountRoles)[number];

export type RoleDefinition = {
  label: AccountRole;
  shortLabel: string;
  malayalam: string;
  hubLabel: string;
  hubMalayalam: string;
  greeting: string;
  greetingMalayalam: string;
  description: string;
  descriptionMalayalam: string;
  capabilities: string[];
  capabilitiesMalayalam: string[];
  primaryAction: { href: string; label: string; malayalam: string };
  nav: string[];
};

export const roleDefinitions: Record<AccountRole, RoleDefinition> = {
  Individual: {
    label: "Individual",
    shortLabel: "Individual",
    malayalam: "വ്യക്തിഗത ഉപയോക്താവ്",
    hubLabel: "Personal hub",
    hubMalayalam: "വ്യക്തിഗത കേന്ദ്രം",
    greeting: "Your annual giving, clearly organised.",
    greetingMalayalam: "നിങ്ങളുടെ വാർഷിക ദാനം വ്യക്തമായി ക്രമീകരിച്ചിരിക്കുന്നു.",
    description: "Calculate personal Zakat, prepare inheritance cases, ask questions and request qualified review.",
    descriptionMalayalam: "വ്യക്തിഗത സകാത്ത് കണക്കാക്കുക, അനന്തരാവകാശ കേസുകൾ തയ്യാറാക്കുക, ചോദ്യങ്ങൾ ചോദിക്കുക, പണ്ഡിത പരിശോധന അഭ്യർത്ഥിക്കുക.",
    capabilities: ["Create and save private calculations", "Prepare inheritance cases", "Book consultations with explicit sharing consent"],
    capabilitiesMalayalam: ["സ്വകാര്യ കണക്കുകൾ സൃഷ്ടിച്ച് സൂക്ഷിക്കുക", "അനന്തരാവകാശ കേസുകൾ തയ്യാറാക്കുക", "വ്യക്തമായ സമ്മതത്തോടെ കൺസൾട്ടേഷൻ ബുക്ക് ചെയ്യുക"],
    primaryAction: { href: "/zakat/", label: "Calculate Zakat", malayalam: "സകാത്ത് കണക്കാക്കുക" },
    nav: ["dashboard", "role", "zakat", "faraid", "masail", "qazi", "reports", "settings"],
  },
  "Family representative": {
    label: "Family representative",
    shortLabel: "Family",
    malayalam: "കുടുംബ പ്രതിനിധി",
    hubLabel: "Family case hub",
    hubMalayalam: "കുടുംബ കേസ് കേന്ദ്രം",
    greeting: "Keep family cases careful, private and traceable.",
    greetingMalayalam: "കുടുംബ കേസുകൾ ശ്രദ്ധയോടെ, സ്വകാര്യമായി, പിന്തുടരാവുന്ന വിധത്തിൽ സൂക്ഷിക്കുക.",
    description: "Prepare family Zakat and inheritance records while keeping consent and verification visible.",
    descriptionMalayalam: "സമ്മതവും പരിശോധനയും വ്യക്തമായി കാണിച്ചുകൊണ്ട് കുടുംബ സകാത്ത്, അനന്തരാവകാശ രേഖകൾ തയ്യാറാക്കുക.",
    capabilities: ["Organise family calculation records", "Build estate and heir information", "Share only a selected case with a Qazi"],
    capabilitiesMalayalam: ["കുടുംബ കണക്കുകളുടെ രേഖകൾ ക്രമീകരിക്കുക", "സ്വത്തും അവകാശികളുടെയും വിവരങ്ങൾ തയ്യാറാക്കുക", "തിരഞ്ഞെടുത്ത കേസ് മാത്രം ഖാസിയുമായി പങ്കിടുക"],
    primaryAction: { href: "/faraid/", label: "Start family case", malayalam: "കുടുംബ കേസ് ആരംഭിക്കുക" },
    nav: ["dashboard", "role", "faraid", "zakat", "qazi", "reports", "masail", "settings"],
  },
  Student: {
    label: "Student",
    shortLabel: "Student",
    malayalam: "വിദ്യാർത്ഥി",
    hubLabel: "Study hub",
    hubMalayalam: "പഠന കേന്ദ്രം",
    greeting: "Learn the method, keep questions, verify the answer.",
    greetingMalayalam: "രീതി പഠിക്കുക, ചോദ്യങ്ങൾ സൂക്ഷിക്കുക, ഉത്തരങ്ങൾ പരിശോധിക്കുക.",
    description: "Use the verified knowledge collection, keep a question history and explore guided examples.",
    descriptionMalayalam: "പരിശോധിച്ച വിജ്ഞാനശേഖരം ഉപയോഗിക്കുക, ചോദ്യങ്ങളുടെ ചരിത്രം സൂക്ഷിക്കുക, മാർഗനിർദേശ ഉദാഹരണങ്ങൾ പഠിക്കുക.",
    capabilities: ["Search published knowledge", "Save a personal question history", "Open calculators as guided learning tools"],
    capabilitiesMalayalam: ["പ്രസിദ്ധീകരിച്ച വിജ്ഞാനം തിരയുക", "വ്യക്തിഗത ചോദ്യചരിത്രം സൂക്ഷിക്കുക", "മാർഗനിർദേശ പഠനത്തിനായി കാൽക്കുലേറ്ററുകൾ ഉപയോഗിക്കുക"],
    primaryAction: { href: "/masail/", label: "Ask a question", malayalam: "ഒരു ചോദ്യം ചോദിക്കുക" },
    nav: ["dashboard", "role", "masail", "knowledge", "zakat", "faraid", "qazi", "settings"],
  },
  "Business owner": {
    label: "Business owner",
    shortLabel: "Business",
    malayalam: "വ്യാപാരി",
    hubLabel: "Business Zakat hub",
    hubMalayalam: "ബിസിനസ് സകാത്ത് കേന്ദ്രം",
    greeting: "Turn business records into a reviewable Zakat case.",
    greetingMalayalam: "ബിസിനസ് രേഖകൾ പരിശോധിക്കാവുന്ന സകാത്ത് കേസാക്കി മാറ്റുക.",
    description: "Map business cash, inventory, receivables and liabilities, then keep the result ready for review.",
    descriptionMalayalam: "ബിസിനസ് പണം, വിൽപ്പന ചരക്ക്, ലഭിക്കാനുള്ള തുക, ബാധ്യതകൾ എന്നിവ രേഖപ്പെടുത്തി ഫലം പരിശോധനയ്ക്ക് തയ്യാറാക്കുക.",
    capabilities: ["Record business wealth categories", "Save annual calculation versions", "Request qualified category review"],
    capabilitiesMalayalam: ["ബിസിനസ് സമ്പത്തിന്റെ വിഭാഗങ്ങൾ രേഖപ്പെടുത്തുക", "വാർഷിക കണക്കുകളുടെ പതിപ്പുകൾ സൂക്ഷിക്കുക", "വിഭാഗപരമായ പണ്ഡിത പരിശോധന അഭ്യർത്ഥിക്കുക"],
    primaryAction: { href: "/zakat/?focus=business", label: "New business calculation", malayalam: "പുതിയ ബിസിനസ് കണക്ക്" },
    nav: ["dashboard", "role", "zakat", "reports", "qazi", "masail", "settings"],
  },
  "Mahallu / institution": {
    label: "Mahallu / institution",
    shortLabel: "Institution",
    malayalam: "മഹല്ല് / സ്ഥാപനം",
    hubLabel: "Institution hub",
    hubMalayalam: "സ്ഥാപന കേന്ദ്രം",
    greeting: "Coordinate institutional cases with a clear audit trail.",
    greetingMalayalam: "വ്യക്തമായ രേഖാപഥത്തോടെ സ്ഥാപന കേസുകൾ ഏകോപിപ്പിക്കുക.",
    description: "Maintain the institution account’s calculations, case reports and consultation requests in one workspace.",
    descriptionMalayalam: "സ്ഥാപന അക്കൗണ്ടിന്റെ കണക്കുകൾ, കേസ് റിപ്പോർട്ടുകൾ, കൺസൾട്ടേഷൻ അഭ്യർത്ഥനകൾ എന്നിവ ഒരിടത്ത് സൂക്ഷിക്കുക.",
    capabilities: ["Maintain institution-owned records", "Track consultation requests", "Export calculation and case reports"],
    capabilitiesMalayalam: ["സ്ഥാപനത്തിന്റെ സ്വന്തം രേഖകൾ സൂക്ഷിക്കുക", "കൺസൾട്ടേഷൻ അഭ്യർത്ഥനകൾ പിന്തുടരുക", "കണക്കുകളും കേസ് റിപ്പോർട്ടുകളും എക്സ്പോർട്ട് ചെയ്യുക"],
    primaryAction: { href: "/reports/", label: "Open case register", malayalam: "കേസ് രജിസ്റ്റർ തുറക്കുക" },
    nav: ["dashboard", "role", "reports", "zakat", "faraid", "qazi", "masail", "settings"],
  },
  "Scholar / Qazi": {
    label: "Scholar / Qazi",
    shortLabel: "Scholar",
    malayalam: "പണ്ഡിതൻ / ഖാസി",
    hubLabel: "Scholar workspace",
    hubMalayalam: "പണ്ഡിത പ്രവർത്തനകേന്ദ്രം",
    greeting: "Prepare sources, cases and consultations with care.",
    greetingMalayalam: "സ്രോതസ്സുകളും കേസുകളും കൺസൾട്ടേഷനുകളും ശ്രദ്ധയോടെ തയ്യാറാക്കുക.",
    description: "Use the knowledge and case tools for preparation. Reviewer authority is never granted by selecting this profile role.",
    descriptionMalayalam: "തയ്യാറെടുപ്പിനായി വിജ്ഞാനവും കേസ് ഉപകരണങ്ങളും ഉപയോഗിക്കുക. ഈ പ്രൊഫൈൽ റോൾ തിരഞ്ഞെടുക്കുന്നതിലൂടെ പരിശോധനാ അധികാരം ലഭിക്കില്ല.",
    capabilities: ["Use the knowledge and question workspace", "Prepare personal case notes", "Access the verified public Qazi directory"],
    capabilitiesMalayalam: ["വിജ്ഞാനവും ചോദ്യ പ്രവർത്തനകേന്ദ്രവും ഉപയോഗിക്കുക", "സ്വകാര്യ കേസ് കുറിപ്പുകൾ തയ്യാറാക്കുക", "പരിശോധിച്ച പൊതു ഖാസി ഡയറക്ടറി ഉപയോഗിക്കുക"],
    primaryAction: { href: "/masail/", label: "Open question desk", malayalam: "ചോദ്യ ഡെസ്ക് തുറക്കുക" },
    nav: ["dashboard", "role", "masail", "knowledge", "qazi", "reports", "settings"],
  },
};

export function normalizeAccountRole(value: string | null | undefined): AccountRole {
  return accountRoles.includes(value as AccountRole) ? value as AccountRole : "Individual";
}

export function getRoleDefinition(value: string | null | undefined) {
  return roleDefinitions[normalizeAccountRole(value)];
}
