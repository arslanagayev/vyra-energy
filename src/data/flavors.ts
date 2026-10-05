/**
 * The five VYRA flavours. Every colour comes from one two-colour combo, Charcoal Violet
 * #3C1A47 + Cyber Line #B6FF00, plus tints and shades of those two.
 */
export interface Flavor {
  id: string;
  /** Full name, e.g. "Lime Rush". */
  name: string;
  /** One-line taste description. */
  notes: string;
  /** Can body colour. */
  can: string;
  /** Logo colour on the can. */
  accent: string;
  /** Small print colour on the can. */
  ink: string;
  /** Background glow behind the can on the page. */
  glow: string;
  caffeineMg: number;
  kcal: number;
}

export const BRAND = {
  violet: '#3c1a47',
  lime: '#b6ff00',
  night: '#0e0612',
  paper: '#f3eefa',
} as const;

export const FLAVORS: readonly Flavor[] = [
  {
    id: 'original',
    name: 'Original Volt',
    notes: 'Citrus peel, a hint of ginger and a clean, dry finish.',
    can: '#3c1a47',
    accent: '#b6ff00',
    ink: '#e9dff0',
    glow: '#5a2a6b',
    caffeineMg: 160,
    kcal: 10,
  },
  {
    id: 'zero',
    name: 'Zero Night',
    notes: 'Black cherry and cold brew notes for the late shift.',
    can: '#170a1d',
    accent: '#b6ff00',
    ink: '#cbbcd6',
    glow: '#2c1238',
    caffeineMg: 200,
    kcal: 5,
  },
  {
    id: 'lime',
    name: 'Lime Rush',
    notes: 'Sharp lime and yuzu with a sparkling, salty edge.',
    can: '#b6ff00',
    accent: '#3c1a47',
    ink: '#3c1a47',
    glow: '#4f6b05',
    caffeineMg: 160,
    kcal: 10,
  },
  {
    id: 'grape',
    name: 'Grape Storm',
    notes: 'Concord grape and blackcurrant, deep and juicy.',
    can: '#5d2672',
    accent: '#d4ff5c',
    ink: '#f1e6f7',
    glow: '#6e2f88',
    caffeineMg: 160,
    kcal: 10,
  },
  {
    id: 'ice',
    name: 'Ice Lilac',
    notes: 'Lavender, pear and mint, cool and floral.',
    can: '#d9c9e8',
    accent: '#3c1a47',
    ink: '#3c1a47',
    glow: '#7d6496',
    caffeineMg: 120,
    kcal: 10,
  },
];

export interface Feature {
  id: string;
  title: string;
  body: string;
}

export const FEATURES: readonly Feature[] = [
  {
    id: 'sugar',
    title: 'Zero sugar',
    body: '0 g sugar, 10 kcal. Sweetened with stevia and monk fruit.',
  },
  {
    id: 'caffeine',
    title: '160 mg natural caffeine',
    body: 'From green coffee beans, released steadily. No jitters, no crash.',
  },
  {
    id: 'electrolytes',
    title: 'Electrolytes + B-vitamins',
    body: 'Sodium, potassium, B6 and B12 to keep long nights sharp.',
  },
  {
    id: 'fruit',
    title: 'Real fruit, real colour',
    body: 'Natural flavours from fruit. No artificial colours, ever.',
  },
];
