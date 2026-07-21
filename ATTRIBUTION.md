# Map data attribution

This file documents provenance and verification. It does not grant rights to
third-party data. Review DATA_LICENSES.md for the publication status of each
derived asset and THIRD_PARTY_NOTICES.md for license notices.

The SVG geometry in this project was generated from:

- Dataset: [datta07/INDIAN-SHAPEFILES](https://github.com/datta07/INDIAN-SHAPEFILES)
- Source file: `INDIA/INDIA_STATES.geojson`
- Source revision: `2c028f5c30fb4191ca1639ff136b152cecdbb69f`
- Dataset license: MIT

The source dataset describes some geometry as primarily 2019 vintage. This
project groups the legacy Dadra & Nagar Haveli and Daman & Diu features into the
current combined union territory, producing 36 navigable administrative units.

All 36 public state and union-territory maps use district geometry from the
MIT-licensed repository revision identified above. Together the public project
contains 750 interactive district features. These totals describe the included
files, not a blanket claim that every layer matches current legal boundaries.
Several source-vintage layers combine Census 2011 geometry with later source
updates, and some predate recent district creations, mergers, or renamings.

The boundary audit compares those 750 mapped features with the 784 districts
reported by the Government of India's Local Government Directory on 14 July
2026. Fifteen region counts differ and twenty-one are count-aligned. Count
alignment is only a triage checkpoint: it does not verify that feature names,
codes, topology, or geometry match the current legal boundaries. The audit keeps
Puducherry's administrative-definition mismatch visible instead of silently
discarding or merging source features.

The public Rajasthan and Nagaland layers contain the upstream source-vintage
sets of 33 and 11 districts, respectively, and retain the source's
2011-oriented boundary marker. More current Survey of India-derived research
layers were prepared during development, but they are not included in Git
because redistribution permission has not been confirmed. Their transformation
tools remain available for reproducible private evaluation.

Display labels are normalized where the source retains an older, truncated, or
variant name. Maharashtra includes Ahilyanagar, Chhatrapati Sambhajinagar,
Dharashiv, Beed, Buldhana, Gondia, Mumbai City, and Raigad; Karnataka displays
Bengaluru Urban for the source's Bangalore district. Goa contains the source's
two districts, North Goa and South Goa, and intentionally does not invent a
division or other intermediate administrative grouping.

Andhra Pradesh uses the repository's 26-district `NEW_DISTRICTS` layer. That
file supplies source-specific district codes but no LGD codes or declared
boundary year, so the interface reports only the metadata actually present.
The Jammu and Kashmir map uses the 20 source features that carry LGD codes;
the separate blank-LGD Muzaffarabad and Mirpur features are not included.
Tamil Nadu's source supplies district codes but does not supply LGD codes.

The Sikkim layer contains Gangtok, Gyalshing, Mangan, Namchi, Pakyong, and
Soreng. The six-district structure is also documented by the
[Government of Sikkim](https://www.sikkim.gov.in/mygovernment/whos-who/district-collectors).
The source uses its `dist_code` and `D_CODE` values as the map's district and
LGD-code fields respectively. Because this source file does not declare a
boundary year, the interface does not invent one.

The Tripura layer contains eight districts. `Sipahijala` and `Unokoti` in the
source are displayed as Sepahijala and Unakoti, matching the spelling used in
the Government of Tripura's
[January 2024 district boundary map](https://tripura.gov.in/sites/default/files/District_Map_January_2024.pdf).
The source identifies four geometries as Census 2011 vintage and four as updated
in 2014; those source-vintage values remain attached to their respective
district features.

The Mizoram layer contains eleven districts, matching the
[Government of Mizoram's administrative list](https://dipr.mizoram.gov.in/page/administrations).
The source's Saiha label is displayed as Siaha, the spelling used in more recent
Mizoram government material. Eight features retain their Census 2011 source
vintage, while Hnahthial, Khawzawl, and Saitual retain the source's 2019-20
vintage.

The Kerala layer contains fourteen districts, matching the
[Kerala Department of Land Revenue district list](https://clr.kerala.gov.in/eng/index.php/department/district).
All fourteen features retain the source's Census 2011 boundary-vintage marker.

The Karnataka division grouping follows the four revenue divisions documented
by the Government of Karnataka: Bengaluru, Mysuru, Belagavi, and Kalaburagi.
The source district layer contains 30 Census-era districts and therefore
predates the separate Vijayanagara district. The map intentionally reports the
source boundary year rather than implying current legal coverage.

The Pune district tehsil/taluka pilot uses Census 2011 subdistrict geometry from
the [India Census 2011 administrative boundaries release](https://github.com/ramSeraph/indian_admin_boundaries/releases/tag/census-2011).
That release credits the Local Government Directory / BharatMaps source and
DataMeet, and publishes the derived data under CC0. The layer retains both the
Census subdistrict code and the separate LGD subdistrict code. Its 14 names
match the Pune subdistrict list in the Government of India's Integrated
Government Online Directory as checked in July 2026.

## Local-only development sources

The following sources were used for development prototypes that are excluded
from the public Git repository. Their presence in a private working directory
does not grant redistribution rights.

The local-only Junnar village pilot uses the
[Survey of India village boundary archive](https://github.com/ramSeraph/opendata/releases/tag/soi-villages).
The archive states that its Survey of India data was retrieved on 13 July 2023
and documents known gaps and unnamed features in the national source. The
Junnar development asset contains the 182 source village relations whose representative
points fall inside the Census 2011 Junnar subdistrict outline. Because the
source archive does not carry Census or LGD village codes, the application preserves a
frozen source-relation identifier instead of inferring a government code.

The local-only Mumbai City and Mumbai Suburban district prototypes use sub-district
geometry from the free
[Survey of India Administrative Boundary Data Base](https://surveyofindia.gov.in/pages/administrative-boundary-data-base-abdb-)
archive retrieved on 20 July 2026. Mumbai Suburban contains Andheri, Borivali,
and Kurla, matching the
[Mumbai Suburban District administration's current taluka list](https://mumbaisuburban.gov.in/en/tehsil/).
Mumbai City contains the archive's single Mumbai administrative sub-district.
The SVGs preserve the archive's `SUBDIS_LGD` values as source-supplied
administrative codes and leave Census sub-district codes blank rather than
inventing them. The archive does not declare a boundary year.

The four local-only Mumbai tehsil prototypes use 24 Brihanmumbai Municipal Corporation
administrative ward polygons distributed as 4 Andheri, 5 Borivali, 6 Kurla,
and 9 Mumbai City wards. The geometry was downloaded on 20 July 2026 from the
[Bharatlas Mumbai ward catalog](https://bharatlas.com/view/wards_mumbai),
which attributes the layer to OpenCity / Oorvani Foundation and publishes it
under the Open Database License 1.0. The catalog reports an update date of
26 May 2026. BMC material independently confirms that Greater Mumbai is
divided into
[24 administrative wards](https://www.mcgm.gov.in/irj/go/km/docs/documents/MCGM%20Department%20List/Wards/Assistant%20Commissioner%20%28A-Ward%29/RTI%20Manuals/AdministrativeofficerEstablishmentAWard%2827011643%29.pdf).
The source does not declare a boundary vintage. Ward polygons are assigned by
their representative points and clipped to the Survey of India sub-district
outlines to contain edge differences between the two sources. These are the
24 lettered administrative wards, not the separate electoral-constituency
ward layer.

These local files are not part of the public release. All public boundary files
are intended for visualization and application prototyping, not official,
surveying, legal, or boundary-sensitive use.
