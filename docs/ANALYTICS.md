# Portfolio analytics

Measurement ID: `G-39B1KGZ9N4`.

## Events

| Event | Trigger | Parameters |
| --- | --- | --- |
| project_open | Open a project using a homepage cluster, index, or preview | project_slug, navigation_source |
| project_section_select | Select a project's section using navigation, field, minimap, or preview | project_slug, section_name, navigation_source |
| project_detail_open | Open a content image in its lightbox | project_slug, section_name, navigation_source |
| contact_click | Click the About email link (hello@modemode.studio) | project_slug when applicable, navigation_source |

Only explicit interactions are tracked. Scrolling, hover, animation frames, and automatic section highlighting do not emit these custom events.

The shared loader only enables GA on modemode.studio and www.modemode.studio. Local previews, other hosts, editor/studio URLs, and framed previews do not load Google's tag. Normal navigation has a 180ms fallback if analytics is blocked.

## GA configuration (September 18, 2026)

- Website stream confirmed active; Enhanced Measurement already enabled.
- Event retention changed from 2 to 14 months. User retention was already 14 months.
- Event-scoped custom dimensions created: Project (`project_slug`), Project section (`section_name`), Navigation source (`navigation_source`).
- Home / studio rule marks the current public IPv4 and this computer's IPv6 address as internal. The Internal Traffic exclusion filter remains in Testing mode: it labels matching traffic without excluding it yet. Addresses may change; update the rule after a network change. The IP values are stored only in GA, not in this repository.
- `contact_click` is registered as a key event, counted once per session with no default monetary value. The About link points to hello@modemode.studio.
- Site event instrumentation goes live only after the code PR is merged and deployed.

## Campaign links

Use these as outgoing links in the named external placements, never for navigation inside the site:

- LinkedIn launch: https://modemode.studio/?utm_source=linkedin&utm_medium=social&utm_campaign=studio_launch
- Instagram profile: https://modemode.studio/?utm_source=instagram&utm_medium=social&utm_campaign=studio_launch&utm_content=bio
- Launch email: https://modemode.studio/?utm_source=newsletter&utm_medium=email&utm_campaign=studio_launch
- Email signature: https://modemode.studio/?utm_source=email_signature&utm_medium=email&utm_campaign=studio_launch

Use lowercase names consistently. Do not include recipient names or email addresses in campaign parameters.

## Review

Weekly, compare source/medium, project page paths, project interaction events, and contact intent once available. The custom dimensions will begin filling after deployment; they cannot reconstruct earlier interactions.

Before activating the Internal Traffic exclusion filter, confirm that your visits appear under the Test data filter name dimension as Internal Traffic. Then change the filter from Testing to Active in Admin > Data filters. An active exclusion drops matching future data from reports; it cannot be recovered later. Testing deliberately keeps that data available.

## Validation

`node tests/analytics-browser.cjs` uses Chrome/Playwright and serves local repository files under an intercepted production hostname. All external traffic is blocked; no test events reach Google or the CMS. It checks initialization counts, real UI interactions, blocked-script navigation, and editor/local exclusions.

After deployment, verify the custom events in GA Realtime or DebugView. An email-link click indicates intent, not a successfully delivered inquiry.
