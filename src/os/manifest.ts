export const openAquaOS = {
  product: 'Open Aqua',
  release: '0.3.1',
  operatingSystem: 'Open Aqua OS',
  mission: 'Protect the owner’s time while helping them make calmer, safer freshwater aquarium decisions.',
  market: 'Freshwater aquarium owners in Singapore and Asia, expanding globally through region packs.',
  inputPolicy: 'Manual-first. Sensors and controllers remain optional adapters, never a requirement.',
  principles: [
    'The real aquarium is the product; screen time is not the goal.',
    'Record observations before interpreting them.',
    'Use the owner’s tank history, not a generic aquarium profile.',
    'Separate measured facts, owner observations, rules and estimates.',
    'Lower confidence when important information is missing or stale.',
    'Make every recommendation explainable and reversible where possible.',
    'Store locally first, then synchronise privately to the owner’s account.',
    'Ship only complete customer screens; roadmap modules stay internal.'
  ] as const,
  boundaries: [
    'Freshwater only.',
    'No disease diagnosis or replacement for a qualified aquatic veterinarian.',
    'No ownership-transfer or animal-identity marketplace features.',
    'No photograph is treated as a laboratory measurement.',
    'No simulation is silently saved as a real event.',
    'No attention traps, streaks or artificial urgency.',
    'No hidden service credential inside the mobile app.'
  ] as const,
  layers: [
    'Capture',
    'Event ledger',
    'Digital twin',
    'Freshness and confidence',
    'Rules and risk detection',
    'Simulation',
    'Care queue',
    'Tank-aware guidance',
    'Owner-facing action'
  ] as const
} as const;
