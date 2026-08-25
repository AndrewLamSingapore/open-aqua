import { OSModule } from './types';

export const openAquaModules = [
  {
    id: 'aqua-now',
    title: 'Aqua Now',
    purpose: 'Turn the current twin into one calm, prioritised owner decision.',
    capabilities: [
      { id: 'now.current-state', title: 'Current tank state', ownerValue: 'Shows All clear, Needs attention or More information needed.', status: 'working', audience: 'owner', route: 'now', evidence: ['src/domain/decisionEngine.ts'] },
      { id: 'now.concern-triage', title: 'Concern triage', ownerValue: 'Prioritises uncertain tests, nitrite, wasting, serial losses and breathing concerns without diagnosing disease.', status: 'working', audience: 'owner', route: 'now', evidence: ['src/domain/concernEngine.ts', 'OA-CONCERN-1.0.0'] },
      { id: 'now.stale-critical-tests', title: 'Stale-test detection', ownerValue: 'Refuses to give false reassurance from old nitrogen-cycle tests.', status: 'working', audience: 'owner', route: 'now', evidence: ['OA-FW-001'] },
      { id: 'now.explanation', title: 'Evidence and explanation', ownerValue: 'Separates observed facts, measurements, possible causes and unknowns behind one primary action.', status: 'working', audience: 'owner', route: 'now', evidence: ['Recommendation.evidenceGroups', 'Recommendation.confidence'] },
      { id: 'now.care-priorities', title: 'Prioritised care queue', ownerValue: 'Ranks due care, warnings and missing information by urgency.', status: 'planned', audience: 'owner', dependsOn: ['care.schedules'] },
      { id: 'now.multi-tank', title: 'Multi-tank overview', ownerValue: 'Surfaces which aquarium needs the owner first.', status: 'planned', audience: 'owner', dependsOn: ['twin.multiple-tanks'] },
      { id: 'now.smart-alerts', title: 'Smart alerts', ownerValue: 'Notifies only when the latest tank context makes an alert useful.', status: 'planned', audience: 'owner', dependsOn: ['care.schedules', 'platform.push'] }
    ]
  },
  {
    id: 'digital-twin',
    title: 'Freshwater Digital Twin',
    purpose: 'Maintain a living, time-ordered model of the real aquarium.',
    capabilities: [
      { id: 'twin.primary-tank', title: 'Primary tank profile', ownerValue: 'Keeps volume, style, location and source-water context together.', status: 'working', audience: 'owner', route: 'memory', evidence: ['Tank', 'src/onboarding/TankOnboarding.tsx'] },
      { id: 'twin.multiple-tanks', title: 'Multiple aquariums', ownerValue: 'Keeps separate histories and care plans for every tank.', status: 'planned', audience: 'owner' },
      { id: 'twin.water-ledger', title: 'Water history', ownerValue: 'Preserves manual readings as a readable timeline.', status: 'working', audience: 'owner', route: 'memory', evidence: ['Tank.readings'] },
      { id: 'twin.care-ledger', title: 'Care history', ownerValue: 'Preserves water changes, feeding, maintenance and observations.', status: 'working', audience: 'owner', route: 'memory', evidence: ['Tank.activities'] },
      { id: 'twin.concern-ledger', title: 'Concern and outcome history', ownerValue: 'Preserves structured concern facts, hypotheses, unknowns, rule decisions and outcome checks.', status: 'working', audience: 'owner', route: 'memory', evidence: ['Tank.concerns', 'ConcernRecord.outcomes', 'src/sync/merge.ts'] },
      { id: 'twin.livestock-ledger', title: 'Livestock records', ownerValue: 'Tracks species, local names, quantity, life stage and status.', status: 'foundation', audience: 'owner', asiaFirst: true, evidence: ['LivestockRecord'] },
      { id: 'twin.plant-ledger', title: 'Plant records', ownerValue: 'Tracks plant identity, placement, light and carbon needs.', status: 'foundation', audience: 'owner', asiaFirst: true, evidence: ['PlantRecord'] },
      { id: 'twin.equipment-ledger', title: 'Equipment records', ownerValue: 'Keeps filters, lights, chillers, air and service context with the tank.', status: 'foundation', audience: 'owner', evidence: ['EquipmentRecord'] },
      { id: 'twin.photo-timeline', title: 'Photo timeline', ownerValue: 'Connects visual change to tests and care events without treating a photo as a test.', status: 'foundation', audience: 'owner', evidence: ['PhotoRecord'] },
      { id: 'twin.build-history', title: 'Tank build history', ownerValue: 'Records substrate, hardscape, filtration and major rebuilds over time.', status: 'planned', audience: 'owner' },
      { id: 'twin.source-water-profiles', title: 'Source-water profiles', ownerValue: 'Keeps tap, filtered, RO or remineralised water separate from tank-water results.', status: 'working', audience: 'owner', route: 'memory', asiaFirst: true, evidence: ['SourceWaterProfile', 'src/onboarding/TankOnboarding.tsx', 'QuickUpdate'] }
    ]
  },
  {
    id: 'quick-capture',
    title: 'Quick Capture',
    purpose: 'Make accurate logging possible in seconds at the aquarium.',
    capabilities: [
      { id: 'capture.manual-water', title: 'Manual water tests', ownerValue: 'Records owner-entered test results with time, method and unit.', status: 'working', audience: 'owner', route: 'quick_update', evidence: ['QuickUpdate'] },
      { id: 'capture.test-quality', title: 'Test-quality context', ownerValue: 'Records test method, instruction check, repeat confirmation and storage concerns.', status: 'working', audience: 'owner', route: 'quick_update', evidence: ['Reading.testMethod', 'Reading.protocolConfirmed', 'Reading.repeatConfirmed', 'Reading.storageConcern'] },
      { id: 'capture.source-water-nitrate', title: 'Source-water nitrate', ownerValue: 'Records a source-water nitrate sample separately from the aquarium result.', status: 'working', audience: 'owner', route: 'quick_update', evidence: ['SourceWaterProfile', 'QuickUpdate'] },
      { id: 'capture.observation', title: 'Owner observations', ownerValue: 'Records behaviour, appearance and tank notes without pretending they are measurements.', status: 'working', audience: 'owner', route: 'quick_update', evidence: ['Activity.observation'] },
      { id: 'capture.structured-concern', title: 'Structured concern capture', ownerValue: 'Records test uncertainty, sample source, confidence, fish decline, loss timelines and red flags without flattening them into diagnoses.', status: 'working', audience: 'owner', route: 'quick_update', evidence: ['ConcernRecord', 'createConcernRecord', 'QuickUpdate'] },
      { id: 'capture.care-actions', title: 'Specific care actions', ownerValue: 'Records water changes, feeding, dosing, cleaning, filter, plant and equipment work.', status: 'working', audience: 'owner', route: 'quick_update', evidence: ['Activity.type', 'QuickUpdate'] },
      { id: 'capture.expanded-parameters', title: 'Expanded freshwater parameters', ownerValue: 'Supports hardness, conductivity, oxygen and planted-tank nutrients.', status: 'working', audience: 'owner', route: 'quick_update', asiaFirst: true, evidence: ['WaterParameter', 'parameterUnits'] },
      { id: 'capture.photos', title: 'Photo capture', ownerValue: 'Adds compressed tank, animal, plant, equipment and test photos.', status: 'planned', audience: 'owner', dependsOn: ['platform.media-storage'] },
      { id: 'capture.speech-drafts', title: 'Speech drafts', ownerValue: 'Turns a spoken update into fields the owner confirms before saving.', status: 'planned', audience: 'owner' },
      { id: 'capture.test-strip-assist', title: 'Test-strip reading assist', ownerValue: 'Suggests values from a calibrated photograph but requires owner confirmation.', status: 'deferred', audience: 'owner', dependsOn: ['capture.photos'] },
      { id: 'capture.batch-log', title: 'Batch logging', ownerValue: 'Applies one care action safely across selected aquariums.', status: 'planned', audience: 'professional', dependsOn: ['twin.multiple-tanks'] }
    ]
  },
  {
    id: 'water-intelligence',
    title: 'Freshwater Intelligence',
    purpose: 'Interpret readings through time, tank context and transparent freshwater rules.',
    capabilities: [
      { id: 'water.nitrogen-rules', title: 'Nitrogen-cycle rules', ownerValue: 'Checks ammonia, tiered nitrite urgency and nitrate using freshness, confidence, source water, symptoms and recent care.', status: 'working', audience: 'owner', route: 'now', evidence: ['OA-CONCERN-1.0.0', 'OA-FW-NO3-001', 'OA-FW-NO3-002', 'OA-TEST-001'] },
      { id: 'water.custom-parameters', title: 'Custom parameters and units', ownerValue: 'Lets specialist owners track values beyond the standard freshwater set.', status: 'planned', audience: 'owner' },
      { id: 'water.trends', title: 'Trends and charts', ownerValue: 'Shows direction, variation and links between tests and care actions.', status: 'planned', audience: 'owner' },
      { id: 'water.freshness-windows', title: 'Contextual freshness windows', ownerValue: 'Uses different stale limits for cycling, stable, quarantine and high-bioload tanks.', status: 'planned', audience: 'owner' },
      { id: 'water.source-comparison', title: 'Source-water comparison', ownerValue: 'Explains how replacement water changes the likely result.', status: 'working', audience: 'owner', route: 'plan', asiaFirst: true, evidence: ['SourceWaterProfile', 'OA-FW-NO3-001', 'previewWaterChange'] },
      { id: 'water.planted-balance', title: 'Planted-tank balance', ownerValue: 'Connects light, carbon, nutrients and plant observations without false precision.', status: 'foundation', audience: 'owner', asiaFirst: true, evidence: ['OA-PLANT-001', 'OA-PLANT-002'] },
      { id: 'water.heat-context', title: 'Tropical heat context', ownerValue: 'Raises oxygen and temperature context during sustained hot indoor conditions.', status: 'planned', audience: 'owner', asiaFirst: true, dependsOn: ['environment.weather'] }
    ]
  },
  {
    id: 'care-rhythm',
    title: 'Care Rhythm',
    purpose: 'Replace scattered reminders with a quiet, tank-aware plan.',
    capabilities: [
      { id: 'care.schedules', title: 'Recurring care schedules', ownerValue: 'Defines tests, water changes, filters, feeding, plants and equipment intervals.', status: 'foundation', audience: 'owner', evidence: ['CareTask'] },
      { id: 'care.generated-plan', title: 'Generated care plan', ownerValue: 'Creates an editable routine from tank style, livestock, plants and equipment.', status: 'planned', audience: 'owner', dependsOn: ['twin.livestock-ledger', 'twin.plant-ledger', 'twin.equipment-ledger'] },
      { id: 'care.completion-history', title: 'Task completion history', ownerValue: 'Connects completed work to the tank memory.', status: 'foundation', audience: 'owner', evidence: ['CareTask.lastCompletedAt', 'Activity.relatedRecordId'] },
      { id: 'care.reminders', title: 'Calm reminders', ownerValue: 'Reminds once, explains why and avoids notification noise.', status: 'planned', audience: 'owner', dependsOn: ['platform.push'] },
      { id: 'care.cycling', title: 'Cycling workflow', ownerValue: 'Guides testing and records progress without declaring a tank ready from one value.', status: 'planned', audience: 'owner' },
      { id: 'care.quarantine', title: 'Quarantine workflow', ownerValue: 'Keeps observation, tests and treatment records separate from the main tank.', status: 'planned', audience: 'owner' },
      { id: 'care.treatment-record', title: 'Treatment record', ownerValue: 'Records what the owner did while keeping diagnosis outside Open Aqua.', status: 'foundation', audience: 'owner', evidence: ['Activity.treatment'] },
      { id: 'care.power-outage', title: 'Power-outage plan', ownerValue: 'Shows the owner’s saved aeration, temperature and contact plan during an outage.', status: 'planned', audience: 'owner', asiaFirst: true }
    ]
  },
  {
    id: 'aqua-guide',
    title: 'Aqua Guide',
    purpose: 'Provide tank-aware guidance from the local twin instead of generic chat.',
    capabilities: [
      { id: 'guide.context-packet', title: 'Private tank context packet', ownerValue: 'Prepares only the relevant tank facts, freshness, history and constraints for guidance.', status: 'foundation', audience: 'platform', evidence: ['src/os/tankContext.ts'] },
      { id: 'guide.explain-state', title: 'Explain the current state', ownerValue: 'Translates rules and evidence into simple owner language.', status: 'working', audience: 'owner', route: 'now', evidence: ['Recommendation.reason', 'Recommendation.evidence'] },
      { id: 'guide.ask-tank', title: 'Ask this tank', ownerValue: 'Answers with the selected tank and recent history already in context.', status: 'planned', audience: 'owner', dependsOn: ['guide.context-packet'] },
      { id: 'guide.action-draft', title: 'Answer-to-action draft', ownerValue: 'Turns guidance into a proposed log, task or simulation that the owner must approve.', status: 'planned', audience: 'owner', dependsOn: ['guide.ask-tank'] },
      { id: 'guide.curated-questions', title: 'Curated question paths', ownerValue: 'Helps owners ask useful questions about water, behaviour, plants, stocking and equipment.', status: 'planned', audience: 'owner', asiaFirst: true },
      { id: 'guide.confidence', title: 'Confidence and missing-data disclosure', ownerValue: 'Says when the tank record cannot support a strong answer.', status: 'working', audience: 'owner', route: 'now', evidence: ['Recommendation.confidence'] },
      { id: 'guide.safety-gate', title: 'Safety and diagnosis gate', ownerValue: 'Lets severe symptoms override reassuring chemistry, stops diagnostic certainty and directs urgent decline to qualified help.', status: 'working', audience: 'platform', evidence: ['Open Aqua OS boundaries', 'OA-CONCERN-1.0.0', 'src/os/tankContext.ts'] }
    ]
  },
  {
    id: 'simulation',
    title: 'Try a Change',
    purpose: 'Compare possible actions without changing the real tank record.',
    capabilities: [
      { id: 'simulate.water-change', title: 'Water-change estimate', ownerValue: 'Estimates nitrate after a selected water change using source-water nitrate.', status: 'working', audience: 'owner', route: 'plan', evidence: ['previewWaterChange'] },
      { id: 'simulate.no-action', title: 'No-action baseline', ownerValue: 'Keeps a visible comparison and never writes a preview as fact.', status: 'working', audience: 'owner', route: 'plan', evidence: ['TryChange'] },
      { id: 'simulate.source-water', title: 'Source-water scenarios', ownerValue: 'Compares tap, aged, remineralised or blended replacement water.', status: 'planned', audience: 'owner', asiaFirst: true },
      { id: 'simulate.stocking', title: 'Stocking scenario', ownerValue: 'Checks space, social group, bioload and compatibility before adding animals.', status: 'planned', audience: 'owner', dependsOn: ['stocking.compatibility'] },
      { id: 'simulate.planted-change', title: 'Light, carbon and nutrient scenario', ownerValue: 'Shows assumptions and trade-offs before changing a planted tank routine.', status: 'planned', audience: 'owner' },
      { id: 'simulate.equipment', title: 'Equipment-change scenario', ownerValue: 'Compares flow, heating, cooling, aeration and service impact.', status: 'planned', audience: 'owner', dependsOn: ['twin.equipment-ledger'] },
      { id: 'simulate.build-planner', title: 'Tank build planner', ownerValue: 'Plans dimensions, substrate, hardscape, water volume and equipment before setup.', status: 'planned', audience: 'owner' }
    ]
  },
  {
    id: 'asia-library',
    title: 'Asia Freshwater Library',
    purpose: 'Ground guidance in reviewed freshwater species, plants and regional conditions.',
    capabilities: [
      { id: 'library.singapore-seed', title: 'Singapore seed records', ownerValue: 'Provides a small reviewed starting set with clear coverage limits.', status: 'working', audience: 'owner', route: 'library', asiaFirst: true, evidence: ['Singapore Freshwater Library'] },
      { id: 'library.asian-fish', title: 'Asian freshwater fish catalogue', ownerValue: 'Uses scientific, English and relevant local trade names.', status: 'planned', audience: 'owner', asiaFirst: true },
      { id: 'library.asian-plants', title: 'Asian aquatic plant catalogue', ownerValue: 'Covers true aquatic status, placement, light, carbon and growth habits.', status: 'planned', audience: 'owner', asiaFirst: true },
      { id: 'library.local-names', title: 'Local and trade-name mapping', ownerValue: 'Reduces species mistakes caused by changing shop names.', status: 'planned', audience: 'owner', asiaFirst: true },
      { id: 'library.review-provenance', title: 'Review and source provenance', ownerValue: 'Shows what was reviewed, by whom, when and where coverage is limited.', status: 'planned', audience: 'platform' },
      { id: 'library.region-packs', title: 'Regional knowledge packs', ownerValue: 'Adds country-specific species availability, climate and water context without changing the core app.', status: 'planned', audience: 'platform', asiaFirst: true },
      { id: 'library.trade-welfare', title: 'Trade and welfare context', ownerValue: 'Flags known welfare, invasive-species and local compliance considerations.', status: 'deferred', audience: 'owner', asiaFirst: true }
    ]
  },
  {
    id: 'stocking-and-plants',
    title: 'Stocking, Plants and Specialist Freshwater',
    purpose: 'Model the living community instead of treating the aquarium as water readings alone.',
    capabilities: [
      { id: 'stocking.compatibility', title: 'Compatibility guidance', ownerValue: 'Checks adult size, group needs, behaviour, water range and habitat zones.', status: 'planned', audience: 'owner', asiaFirst: true },
      { id: 'stocking.capacity', title: 'Transparent stocking support', ownerValue: 'Shows inputs and uncertainty instead of a magic fish-per-litre number.', status: 'planned', audience: 'owner' },
      { id: 'stocking.plan', title: 'Stocking plan', ownerValue: 'Lets the owner stage proposed animals before they become active livestock.', status: 'planned', audience: 'owner' },
      { id: 'stocking.lifecycle', title: 'Livestock lifecycle log', ownerValue: 'Records acquisition, quarantine, movement, rehoming and loss privately.', status: 'planned', audience: 'owner' },
      { id: 'stocking.large-exotic', title: 'Large and high-value fish profile', ownerValue: 'Adds growth, space, filtration, feeding and contingency context for specialist tanks.', status: 'foundation', audience: 'owner', asiaFirst: true, evidence: ['Tank.profile.large_exotic'] },
      { id: 'stocking.shrimp', title: 'Shrimp workflow', ownerValue: 'Adds hardness, TDS, moulting and mineral context for freshwater shrimp.', status: 'planned', audience: 'owner', asiaFirst: true },
      { id: 'stocking.blackwater', title: 'Blackwater workflow', ownerValue: 'Handles low-conductivity, tannin-rich systems without applying generic community assumptions.', status: 'planned', audience: 'owner', asiaFirst: true },
      { id: 'stocking.planted', title: 'Planted freshwater workflow', ownerValue: 'Connects plant inventory, placement, pruning, light, carbon and nutrients.', status: 'planned', audience: 'owner', asiaFirst: true }
    ]
  },
  {
    id: 'equipment-and-environment',
    title: 'Equipment and Environment',
    purpose: 'Connect life-support equipment and tropical conditions to the twin.',
    capabilities: [
      { id: 'equipment.inventory', title: 'Equipment inventory', ownerValue: 'Keeps the active hardware and important specifications with its tank.', status: 'foundation', audience: 'owner', evidence: ['EquipmentRecord'] },
      { id: 'equipment.service', title: 'Service and replacement history', ownerValue: 'Records filter, impeller, light, chiller and consumable work.', status: 'foundation', audience: 'owner', evidence: ['Activity.equipment_service', 'EquipmentRecord.lastServicedAt'] },
      { id: 'equipment.calculators', title: 'Freshwater calculators', ownerValue: 'Provides unit, volume, dosing, flow, heating, cooling and CO2 arithmetic with limits.', status: 'planned', audience: 'owner' },
      { id: 'equipment.compare', title: 'Product comparison', ownerValue: 'Compares owner-entered equipment facts without hidden ranking.', status: 'deferred', audience: 'owner' },
      { id: 'environment.weather', title: 'Local weather context', ownerValue: 'Adds heat and storm context only when location permission is granted.', status: 'deferred', audience: 'owner', asiaFirst: true },
      { id: 'environment.calendar', title: 'Calendar handoff', ownerValue: 'Lets the owner choose which care task becomes a calendar event.', status: 'deferred', audience: 'owner' },
      { id: 'equipment.sensor-adapters', title: 'Optional sensor adapters', ownerValue: 'Accepts validated readings from supported hardware without making sensors mandatory.', status: 'deferred', audience: 'platform' },
      { id: 'equipment.controller-adapters', title: 'Optional controller adapters', ownerValue: 'Reads supported controller state through isolated, permissioned integrations.', status: 'deferred', audience: 'platform', dependsOn: ['equipment.sensor-adapters'] }
    ]
  },
  {
    id: 'shared-care',
    title: 'Shared Care',
    purpose: 'Let another person help without losing ownership, context or accountability.',
    capabilities: [
      { id: 'share.caretaker-role', title: 'Caretaker access', ownerValue: 'Gives a helper limited access to selected tanks and tasks.', status: 'planned', audience: 'caretaker' },
      { id: 'share.handoff', title: 'Care handoff', ownerValue: 'Shows what is due, what changed and what must not be altered.', status: 'planned', audience: 'caretaker', dependsOn: ['care.schedules'] },
      { id: 'share.task-assignment', title: 'Task assignment', ownerValue: 'Assigns and confirms specific care without exposing the whole account.', status: 'planned', audience: 'caretaker' },
      { id: 'share.private-view', title: 'Private read-only view', ownerValue: 'Shares a time-limited tank summary controlled by the owner.', status: 'planned', audience: 'owner' },
      { id: 'share.audit', title: 'Shared-care audit trail', ownerValue: 'Records who logged or completed a shared action.', status: 'planned', audience: 'owner' }
    ]
  },
  {
    id: 'reports-and-professional',
    title: 'Reports and Professional Operations',
    purpose: 'Turn trusted tank histories into useful owner and professional records.',
    capabilities: [
      { id: 'report.json-export', title: 'Owner JSON export', ownerValue: 'Lets the owner download the private tank document.', status: 'working', audience: 'owner', route: 'account', evidence: ['AccountSheet export'] },
      { id: 'report.csv-export', title: 'CSV export', ownerValue: 'Exports water and care history for analysis.', status: 'planned', audience: 'owner' },
      { id: 'report.shareable', title: 'Shareable tank report', ownerValue: 'Creates a dated summary with readings, history, assumptions and limitations.', status: 'planned', audience: 'owner' },
      { id: 'report.analytics', title: 'Tank analytics', ownerValue: 'Summarises trends, maintenance consistency and missing-data periods.', status: 'planned', audience: 'owner' },
      { id: 'pro.portfolio', title: 'Client and facility portfolio', ownerValue: 'Manages many owners, sites and tanks with role separation.', status: 'deferred', audience: 'professional' },
      { id: 'pro.routes', title: 'Maintenance routes and work orders', ownerValue: 'Plans visits, tasks, completion evidence and follow-up.', status: 'deferred', audience: 'professional' },
      { id: 'pro.inventory', title: 'Consumables and livestock inventory', ownerValue: 'Tracks professional stock, quarantine and usage separately from owner tanks.', status: 'deferred', audience: 'professional' },
      { id: 'pro.team-roles', title: 'Professional team roles', ownerValue: 'Separates administrators, technicians, viewers and clients.', status: 'deferred', audience: 'professional' }
    ]
  },
  {
    id: 'platform-and-trust',
    title: 'Platform, Privacy and Reliability',
    purpose: 'Keep tank history private, recoverable and available across approved devices.',
    capabilities: [
      { id: 'platform.accounts', title: 'Owner accounts', ownerValue: 'Provides native Apple sign-in plus independent email confirmation, sign-in and password recovery.', status: 'working', audience: 'platform', route: 'account', evidence: ['Supabase Auth', 'expo-apple-authentication', 'appleSignIn tests'] },
      { id: 'platform.secure-session', title: 'Encrypted device session', ownerValue: 'Stores session chunks in the operating system secure store.', status: 'working', audience: 'platform', route: 'account', evidence: ['Expo SecureStore'] },
      { id: 'platform.local-first', title: 'Local-first records', ownerValue: 'Saves a tank update on the phone before starting a network request.', status: 'working', audience: 'platform', evidence: ['AsyncStorage', 'markTankChanged'] },
      { id: 'platform.cloud-sync', title: 'Private cloud synchronisation', ownerValue: 'Synchronises the owner’s tank document through Supabase.', status: 'working', audience: 'platform', evidence: ['tank_documents', 'RLS'] },
      { id: 'platform.offline-retry', title: 'Offline retry', ownerValue: 'Keeps changes locally and retries when connectivity returns.', status: 'working', audience: 'platform', evidence: ['NetInfo', 'syncTankRecordWithRetry'] },
      { id: 'platform.conflict-merge', title: 'Deterministic conflict merge', ownerValue: 'Preserves independent logs and resolves the same record by explicit update time.', status: 'working', audience: 'platform', evidence: ['mergeTankSnapshots'] },
      { id: 'platform.realtime', title: 'Realtime device notification', ownerValue: 'Prompts a signed-in device to synchronise when its cloud tank changes.', status: 'working', audience: 'platform', evidence: ['postgres_changes'] },
      { id: 'platform.owner-isolation', title: 'Owner-only database access', ownerValue: 'Uses row-level security so an account can access only its own tank records.', status: 'working', audience: 'platform', evidence: ['auth.uid() = user_id'] },
      { id: 'platform.data-deletion', title: 'In-app account deletion', ownerValue: 'Permanently removes the owner account through a server-side function.', status: 'working', audience: 'platform', route: 'account', evidence: ['delete-account'] },
      { id: 'platform.media-storage', title: 'Private media storage', ownerValue: 'Stores compressed photos with owner-only access and recovery rules.', status: 'planned', audience: 'platform' },
      { id: 'platform.push', title: 'Push notifications', ownerValue: 'Delivers owner-approved reminders and urgent state changes.', status: 'planned', audience: 'platform' },
      { id: 'platform.ios', title: 'iPhone application', ownerValue: 'Compiles as a real iOS application and is prepared for EAS/TestFlight.', status: 'foundation', audience: 'platform', evidence: ['Expo', 'eas.json'] },
      { id: 'platform.android', title: 'Android application', ownerValue: 'Reuses the shared product model after iPhone validation.', status: 'deferred', audience: 'platform' },
      { id: 'platform.web', title: 'Web application', ownerValue: 'Provides a larger-screen view after mobile workflows are proven.', status: 'deferred', audience: 'platform' },
      { id: 'platform.watch', title: 'Watch companion', ownerValue: 'Shows approved glanceable status and quick task completion.', status: 'deferred', audience: 'platform' },
      { id: 'platform.thematic-sound', title: 'Original thematic sound', ownerValue: 'Lets the owner play a short, calm aquatic motif without autoplay or looping.', status: 'working', audience: 'owner', route: 'now', evidence: ['src/sound/SoundControl.tsx', 'assets/open-aqua-theme-v1.mp3', 'sound preference tests'] },
      { id: 'platform.accessibility', title: 'Accessible interaction', ownerValue: 'Uses screen-reader labels, large targets, readable contrast and dynamic layouts.', status: 'foundation', audience: 'platform', evidence: ['React Native accessibility labels'] },
      { id: 'platform.localization', title: 'Regional language packs', ownerValue: 'Localises interface and species names without changing scientific identity.', status: 'planned', audience: 'platform', asiaFirst: true },
      { id: 'platform.backup-restore', title: 'Backup and tested restoration', ownerValue: 'Documents, tests and monitors database and media recovery.', status: 'planned', audience: 'platform' },
      { id: 'platform.crash-monitoring', title: 'Crash and sync monitoring', ownerValue: 'Detects failures without collecting unnecessary tank content.', status: 'planned', audience: 'platform' }
    ]
  }
] as const satisfies readonly OSModule[];

export const allCapabilities = openAquaModules.flatMap((module) =>
  module.capabilities.map((capability) => ({ ...capability, moduleId: module.id, moduleTitle: module.title }))
);

export const workingCapabilities = allCapabilities.filter((capability) => capability.status === 'working');

export function capabilityCounts() {
  return allCapabilities.reduce(
    (counts, capability) => ({ ...counts, [capability.status]: counts[capability.status] + 1 }),
    { working: 0, foundation: 0, planned: 0, deferred: 0 }
  );
}
