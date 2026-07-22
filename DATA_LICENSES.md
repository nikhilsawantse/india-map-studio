# Boundary data licenses and publication status

The MIT license in LICENSE applies to the original application code,
documentation, generators, and synthetic sample data. It does not replace or
override the terms attached to third-party geographic data.

This inventory is part of the release gate. A boundary asset marked HOLD must
not be included in a public release until its redistribution rights are
confirmed or its geometry is replaced with a compatible source.

## Inventory

| Data or derived assets | Source | Declared terms | Public release |
| --- | --- | --- | --- |
| India outline, state and union-territory boundaries, and all 36 public state/UT district SVGs | datta07/INDIAN-SHAPEFILES, revision 2c028f5c30fb4191ca1639ff136b152cecdbb69f | MIT | READY with attribution and upstream notice |
| Pune tehsil geometry | ramSeraph/indian_admin_boundaries Census 2011 release | CC0 1.0; upstream requests attribution to DataMeet and the original government source where possible | READY with requested attribution |
| Mumbai administrative ward source geometry | OpenCity / Oorvani Foundation through Bharatlas | ODbL 1.0 | READY only when distributed without geometry derived from a restricted source |
| Optional current-boundary Rajasthan and Nagaland research outputs | Survey of India Administrative Boundary Data Base | No open redistribution license has been identified; the Survey of India website copyright policy requires written permission for reproduction | LOCAL ONLY; the public SVGs use the MIT source-vintage layers |
| Mumbai City and Mumbai Suburban district SVGs | Survey of India Administrative Boundary Data Base | Written reproduction permission required by the published copyright policy | HOLD |
| Junnar village SVG | Survey of India village archive republished by ramSeraph/opendata | The release page identifies Survey of India as the source but does not declare a redistribution license | HOLD |
| Andheri, Borivali, Kurla, and Mumbai tehsil SVGs | OpenCity ward geometry clipped to Survey of India sub-district outlines | Mixed ODbL and Survey of India-derived geometry | HOLD |
| LGD, Census, IGOD, and state-government names, counts, and identifiers | Government directories and publications listed in ATTRIBUTION.md | Used as factual reference metadata; source terms continue to apply | REVIEW on each data refresh |
| Compact India Post PIN directory sample | Department of Posts `IndiaPost/pin` repository and OGD catalog, retrieved 2026-07-22 | Government Open Data License - India | READY with publisher, catalog, and record links; district highlights are explicitly distinguished from postal boundaries |

## Files excluded from the public repository

- assets/maps/districts/maharashtra/mumbai-city.svg
- assets/maps/districts/maharashtra/mumbai-suburban.svg
- assets/maps/tehsils/maharashtra/pune/junnar.svg
- assets/maps/tehsils/maharashtra/mumbai-city/mumbai.svg
- assets/maps/tehsils/maharashtra/mumbai-suburban/andheri.svg
- assets/maps/tehsils/maharashtra/mumbai-suburban/borivali.svg
- assets/maps/tehsils/maharashtra/mumbai-suburban/kurla.svg
- sample-data/junnar-village-demo.csv
- sample-data/junnar-village-validation-demo.csv
- sample-data/junnar-village-field-types-demo.csv

These paths are ignored by Git. Restricted development copies are backed up
under the ignored .codex-tmp/restricted-assets directory. Keeping an asset in a
local working tree is not a declaration that it can be redistributed.

To publish one of these layers later, either:

1. obtain written permission covering public redistribution and derivative
   SVG publication;
2. regenerate the asset from a clearly compatible open-data source; or
3. continue excluding the asset and provide an end-user import workflow.

## Contributor requirements

Every new geographic layer must document:

- source organization and dataset title;
- direct source URL;
- retrieval date and boundary vintage, when known;
- exact license name and license URL;
- required attribution;
- transformations performed;
- feature count and identifier fields; and
- whether redistribution and derivative works are explicitly allowed.

Data without verifiable redistribution rights will not be merged as a bundled
asset. Factual corrections and source links are welcome.

This file is an engineering inventory, not legal advice. See ATTRIBUTION.md for
detailed provenance and THIRD_PARTY_NOTICES.md for notices.
