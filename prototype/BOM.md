# Prototype V0 — Minimum Bill of Materials

The BOM is intentionally technology-class based until sourcing is performed. Do not lock a vendor merely because it is cheap.

| Component | V0 status | Purpose | Admission test |
|---|---|---|---|
| ESP32-class development board | Required | sampling, timestamps, transport | stable sampling + enough ADC/I/O |
| Waterproof temperature probe | Required | continuous temperature trajectory | repeatable against reference thermometer |
| pH probe + interface | Required | continuous pH trajectory | calibratable, characterized drift |
| Conductivity/TDS probe + interface | Required | continuous ionic-strength trajectory | stable/repeatable; raw conductivity preferred where available |
| 5V/USB power supply | Required | stable instrument power | no material measurement noise |
| Breadboard / connectors / resistors | Required | experimental assembly | reliable connections |
| Manual ammonia test | Required reference | periodic ammonia observation | method/brand/unit/time recorded |
| Manual nitrite/nitrate/KH tests | Conditional reference | labels/context for defined experiments | include only when experiment requires them |
| Local computer / existing phone | Reuse | logging/analysis/display | no dedicated display required |
| Continuous ammonia sensor | Excluded from V0 baseline | later information-value experiment | only after fusion concept proves value |
| Dissolved oxygen sensor | Candidate | test incremental information gain | must justify lifecycle cost + burden |
| Custom PCB | Deferred | none for initial proof | only if module/breadboard limits validity |
| Enclosure | Minimal/optional | electrical/mechanical protection | only as needed for safe experiment |

## Cost rule

Record actual landed cost, calibration consumables, expected replacement burden and maintenance time. The cheapest purchase price is not necessarily the cheapest experimental signal.

## Procurement gate

Before purchase, each sensor candidate must have:

- measurable range suitable for freshwater aquarium conditions;
- stated or independently testable accuracy/repeatability;
- calibration procedure;
- replacement/consumable availability;
- interface compatible with the prototype;
- no requirement for unsafe livestock experimentation.

Final vendor/SKU selection should be documented only after sourcing and bench comparison.