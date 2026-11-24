/**
 * YOUR INTERESTS LIVE HERE.
 *
 * To add a new category later, copy one of the blocks below and edit it.
 * - `keywords.strong`: words that almost always mean "this is relevant"
 * - `keywords.related`: looser words that count a little (lets in adjacent news)
 * - `newsQueries`: searches run against Google News
 * - `federalRegister`: searches/agency filters run against the Federal Register (official rules & notices)
 * - `courtQueries`: searches run against CourtListener (federal court dockets)
 * - `parentId`: makes this a subtopic of another category
 */

export type Category = {
  id: string;
  label: string;
  emoji: string;
  parentId?: string;
  defaultEnabled: boolean;
  keywords: { strong: string[]; related: string[] };
  newsQueries: string[];
  federalRegister?: { terms?: string[]; agencies?: string[]; significantOnly?: boolean };
  courtQueries?: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: "antitrust",
    label: "Antitrust",
    emoji: "⚖️",
    defaultEnabled: true,
    keywords: {
      strong: [
        "antitrust", "monopoly", "monopolization", "sherman act", "clayton act",
        "merger challenge", "price-fixing", "price fixing", "bid rigging", "cartel",
        "anticompetitive", "anti-competitive", "competition law", "hsr act", "hart-scott-rodino",
      ],
      related: [
        "ftc", "federal trade commission", "antitrust division", "merger", "acquisition",
        "consent decree", "divestiture", "market power", "competition", "dominant",
        "exclusive dealing", "collusion", "doj", "class action",
      ],
    },
    newsQueries: ["antitrust", "FTC merger challenge", "DOJ antitrust division lawsuit"],
    federalRegister: { terms: ["antitrust"], agencies: ["federal-trade-commission", "antitrust-division"] },
    courtQueries: ['"antitrust"'],
  },
  {
    id: "regulation",
    label: "Gov't Regulation",
    emoji: "🏛️",
    defaultEnabled: true,
    keywords: {
      strong: [
        "final rule", "proposed rule", "rulemaking", "regulation", "deregulation",
        "executive order", "federal register", "notice of proposed rulemaking", "comment period",
      ],
      related: [
        "agency", "regulator", "regulatory", "compliance", "rescind", "rollback",
        "guidance", "sec", "fcc", "epa", "cfpb", "omb", "oira", "congress", "loper bright",
      ],
    },
    newsQueries: ["new federal regulation", "final rule agency", "regulatory rollback"],
    federalRegister: { significantOnly: true },
  },
  {
    id: "railroad",
    label: "Railroad Litigation",
    emoji: "🚂",
    parentId: "antitrust",
    defaultEnabled: true,
    keywords: {
      strong: [
        "railroad", "railway", "rail merger", "surface transportation board", "stb",
        "union pacific", "norfolk southern", "bnsf", "csx", "canadian pacific kansas city",
        "cpkc", "canadian national",
      ],
      related: ["freight rail", "rail", "shippers", "trackage rights", "rail rates", "fuel surcharge"],
    },
    newsQueries: ["railroad lawsuit", "Surface Transportation Board ruling", "railroad merger antitrust"],
    federalRegister: { agencies: ["surface-transportation-board"] },
    courtQueries: ['railroad antitrust', '"Surface Transportation Board"'],
  },
];

export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);
