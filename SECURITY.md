# Security policy

## Supported version

| Release line | Supported |
| --- | --- |
| 1.x | Yes |
| Earlier development revisions | No |

Security fixes apply to the latest Version 1 minor or patch release and the
corresponding revision on the default branch.

## Report a vulnerability

Please do not open a public issue for an exploitable vulnerability.

Use GitHub's private vulnerability reporting feature in the repository
Security tab. If that feature is not available, use the private contact method
shown on the repository owner's GitHub profile and include:

- the affected page, file, or version;
- steps to reproduce;
- the expected and actual result;
- likely impact;
- a minimal proof of concept, if safe; and
- any suggested mitigation.

You should receive an acknowledgement within seven days. The maintainers will
validate the report, coordinate a fix, and credit the reporter unless anonymity
is requested.

## Security-sensitive areas

Extra care is required for:

- custom SVG and GeoJSON import and sanitization;
- imported CSV and JSON content;
- generated standalone HTML;
- templated URLs and image fields;
- browser storage and portable workspace files; and
- future deployment workflows and third-party dependencies.

Please test only with data and systems you are authorized to use.
