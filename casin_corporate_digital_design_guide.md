---
title: "Executive Resort Modernism"
subtitle: "Corporate Digital Design Guide"
version: "1.0"
status: "Reference Standard"
audience:
  - Brand and communications teams
  - UX and product designers
  - Web and application developers
  - Data and analytics teams
  - Corporate communications
  - Agency and implementation partners
---

# Executive Resort Modernism  
## Corporate Digital Design Guide

## 1. Purpose

This guide defines a reusable design system for internal corporate websites, digital applications, executive dashboards, presentations, reports, communications, and supporting digital assets.

The visual direction is inspired by the corporate aesthetic commonly associated with leading Las Vegas hospitality and gaming organizations, while deliberately avoiding consumer casino, booking, entertainment, and promotional patterns.

The intended result is a design language that feels:

- Premium without being extravagant
- Confident without being aggressive
- Editorial without sacrificing usability
- Visually distinctive without becoming decorative
- Appropriate for executives, employees, investors, partners, and regulators
- Consistent across websites, applications, reports, presentations, signage, and communications

The system is called **Executive Resort Modernism**.

Its primary design principle is:

> Combine the refinement of luxury hospitality with the clarity, accessibility, and operational rigor of an enterprise platform.

---

# 2. Design Strategy

## 2.1 Core aesthetic

The design language should communicate:

- Corporate confidence
- Established institutional credibility
- Premium hospitality
- Operational discipline
- Human-centered service
- Architectural scale
- Modern technology
- Measurable performance
- Responsible governance

The aesthetic should be recognizable as belonging to a premium hospitality organization, but it must not resemble a consumer gambling or resort-booking experience.

## 2.2 Design model

Use two coordinated interface modes.

### Brand Mode

Use Brand Mode for:

- Corporate homepages
- Executive communications
- Strategy pages
- Transformation programs
- Culture and people content
- ESG and community impact
- Corporate storytelling
- Major announcements
- Annual reports
- Leadership events

Brand Mode characteristics:

- Dark jewel-tone backgrounds
- Architectural or employee photography
- Editorial typography
- Champagne-gold accents
- Generous whitespace
- Controlled image mosaics
- Strong section dividers
- Cinematic but restrained motion

### Work Mode

Use Work Mode for:

- Dashboards
- Internal applications
- Forms and workflows
- Policy libraries
- Project management
- Knowledge bases
- Employee services
- Search
- Operational reporting
- Service portals
- Data tables
- Administration

Work Mode characteristics:

- White, ivory, or pale-gray surfaces
- Compact and consistent spacing
- Corporate sans-serif typography
- Limited decorative photography
- Strong information hierarchy
- Clear status indicators
- Persistent navigation and filters
- Accessible interaction states
- Responsive, task-oriented layouts

### Mode transition rule

Brand Mode may introduce a business area or strategic topic. Work Mode should take over when the user begins performing a task.

Example:

```text
Executive Strategy Landing Page
    ↓
Transformation Program Overview
    ↓
Program Dashboard
    ↓
Project Record
    ↓
Approval Workflow
```

The first two levels may use Brand Mode. The final three should use Work Mode.

---

# 3. Brand Foundations

## 3.1 Brand attributes

All digital assets should express the following attributes.

| Attribute | Meaning | Design expression |
|---|---|---|
| Premium | High quality and intentionality | Strong typography, refined spacing, high-quality imagery |
| Trustworthy | Stable, governed, reliable | Conservative layouts, clear labels, strong accessibility |
| Human | Hospitality and employee focus | Authentic people photography, approachable language |
| Strategic | Forward-looking and purposeful | Executive summaries, strategic pillars, outcomes |
| Operational | Capable of supporting work | Consistent controls, dense data patterns, predictable interaction |
| Distinctive | Recognizable visual identity | Jewel tones, warm metallic accents, editorial display type |
| Global | Suitable across regions | Flexible layouts, localization, inclusive imagery |
| Responsible | Governance and stewardship | Transparent reporting, traceable ownership, accessible content |

## 3.2 Brand personality

The preferred personality is:

- Formal
- Calm
- Assured
- Polished
- Intelligent
- Welcoming
- Deliberate
- Contemporary

Avoid a personality that feels:

- Flashy
- Noisy
- Urgent without reason
- Promotional
- Playful in high-risk workflows
- Exclusive to the point of being inaccessible
- Nostalgic or themed
- Visually tied to casino gaming

---

# 4. Color System

## 4.1 Core palette

The palette should use dark institutional colors, warm neutrals, and controlled metallic accents.

| Token | Hex | Primary use |
|---|---:|---|
| `navy-950` | `#0B1929` | Global navigation, dark backgrounds |
| `navy-900` | `#10243E` | Primary brand background |
| `navy-700` | `#29425C` | Secondary dark surfaces |
| `slate-700` | `#405866` | Dashboard emphasis, secondary panels |
| `burgundy-900` | `#3D0B10` | Deep section backgrounds |
| `burgundy-700` | `#5A1016` | Strategic emphasis |
| `burgundy-500` | `#82323A` | Interactive emphasis and charts |
| `gold-600` | `#A9874E` | Strong accent |
| `gold-500` | `#C5A467` | Standard champagne accent |
| `gold-300` | `#DEC99F` | Light decorative detail |
| `ivory-100` | `#F5F2EA` | Editorial background |
| `mist-100` | `#EDF0F2` | Dashboard and table background |
| `stone-200` | `#D9D6CE` | Dividers and subtle borders |
| `charcoal-900` | `#25282A` | Primary text |
| `charcoal-700` | `#4B4F52` | Secondary text |
| `white` | `#FFFFFF` | Primary surface |
| `teal-700` | `#287C78` | Positive status and sustainability |
| `amber-700` | `#B66C25` | Warning state |
| `red-700` | `#A13D45` | Critical state |
| `blue-600` | `#326FA8` | Informational state |

## 4.2 Color roles

### Primary brand colors

Use:

- Midnight navy
- Deep burgundy
- Warm ivory
- White

These colors establish the overall corporate environment.

### Accent colors

Use champagne gold for:

- Fine rules
- Eyebrow labels
- Selected icons
- Active navigation markers
- Featured metrics
- Editorial dividers
- Premium highlights

Do not use gold as:

- Long-form body text
- A default button color on light backgrounds
- A status indicator
- A replacement for proper contrast
- A decorative outline around every component

### Semantic colors

| State | Color | Usage |
|---|---|---|
| Success | Teal | Completed, healthy, on target |
| Warning | Amber | Attention required, moderate risk |
| Critical | Red | Failure, major risk, overdue |
| Information | Blue | Guidance, informational notices |
| Neutral | Slate | Not started, inactive, unknown |

Semantic colors must retain the same meaning across all applications.

## 4.3 Color combinations

Approved combinations:

| Background | Primary text | Accent |
|---|---|---|
| Navy | White | Champagne gold |
| Burgundy | White | Pale gold |
| Ivory | Charcoal | Burgundy |
| White | Charcoal | Navy |
| Mist | Charcoal | Slate |
| Slate | White | Gold |

Avoid:

- Gold text on white
- Burgundy text on black
- Gray text on dark photography
- Multiple jewel tones competing on the same screen
- Decorative gradients in operational dashboards
- Neon colors
- Saturated casino-style red and gold combinations

## 4.4 Gradient usage

Gradients should be subtle and architectural.

Approved examples:

```css
background: linear-gradient(
  135deg,
  #0B1929 0%,
  #10243E 55%,
  #29425C 100%
);
```

```css
background: linear-gradient(
  120deg,
  rgba(11, 25, 41, 0.95) 0%,
  rgba(11, 25, 41, 0.55) 55%,
  rgba(11, 25, 41, 0.10) 100%
);
```

Use gradients for:

- Hero image overlays
- Section transitions
- Presentation title slides
- Video title cards

Do not use gradients for:

- Form fields
- Data tables
- Status indicators
- Dense application surfaces

---

# 5. Typography

## 5.1 Type system

Use a three-role typography model.

### Editorial display serif

Use for:

- Executive statements
- Campaign titles
- Strategic themes
- Annual report headings
- Major section titles
- Pull quotes

Recommended options:

- Source Serif 4
- Libre Baskerville
- DM Serif Display
- Merriweather

### Corporate sans-serif

Use for:

- Navigation
- Body copy
- Forms
- Dashboards
- Tables
- Application interfaces
- Captions
- Metadata

Recommended options:

- Inter
- Source Sans 3
- IBM Plex Sans
- Noto Sans

### Condensed or tracked uppercase style

Use for:

- Eyebrow labels
- Section markers
- Small metric categories
- Document classifications
- Navigation group headings

This may use the corporate sans-serif with increased letter spacing rather than a separate font family.

## 5.2 Type scale

| Style | Desktop | Mobile | Weight | Typical use |
|---|---:|---:|---:|---|
| Display XL | 72 px | 44 px | 400–600 | Executive campaign |
| Display L | 56 px | 38 px | 400–600 | Homepage hero |
| H1 | 44 px | 34 px | 600 | Page title |
| H2 | 34 px | 28 px | 600 | Major section |
| H3 | 26 px | 23 px | 600 | Subsection |
| H4 | 21 px | 19 px | 600 | Card group |
| Body L | 19 px | 18 px | 400 | Introductory copy |
| Body | 16 px | 16 px | 400 | Standard copy |
| Body S | 14 px | 14 px | 400 | Metadata |
| Label | 12 px | 12 px | 600 | Uppercase label |
| Data XL | 48 px | 38 px | 600 | KPI value |
| Data L | 32 px | 28 px | 600 | Card metric |

## 5.3 Line length

Recommended maximums:

- Long-form editorial text: 65–75 characters
- Application help text: 55–70 characters
- Executive statements: 25–45 characters
- Data table cells: content-specific
- Presentation body text: no more than 12–15 words per line

## 5.4 Typography rules

- Use sentence case for most headings.
- Use uppercase only for short labels.
- Never use all-caps for paragraphs.
- Avoid ultra-light text weights.
- Do not use serif fonts in tables or forms.
- Limit a page to two primary font families.
- Preserve at least 1.4 line height for body text.
- Avoid centered body text except for short campaign statements.
- Use tabular numerals in dashboards and financial reporting.

---

# 6. Spacing and Layout

## 6.1 Spacing scale

Use an 8-point base grid.

| Token | Value |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 24 px |
| `space-6` | 32 px |
| `space-7` | 40 px |
| `space-8` | 48 px |
| `space-9` | 64 px |
| `space-10` | 80 px |
| `space-11` | 96 px |
| `space-12` | 128 px |

Brand Mode should use larger spacing tokens.

Work Mode should use smaller, denser spacing tokens.

## 6.2 Grid

Use a responsive 12-column grid.

Recommended desktop configuration:

```text
Maximum canvas width: 1440 px
Standard content width: 1200–1320 px
Editorial reading width: 720–840 px
Outer margin: 32–64 px
Column gap: 24 px
```

Tablet:

```text
8-column grid
Outer margin: 24–32 px
Column gap: 20 px
```

Mobile:

```text
4-column grid
Outer margin: 16–20 px
Column gap: 16 px
```

## 6.3 Density

Define three density levels.

| Density | Use |
|---|---|
| Spacious | Homepages, executive pages, annual reports |
| Standard | General intranet, knowledge pages, project pages |
| Compact | Dashboards, tables, administration, high-volume workflows |

Users may be allowed to select Standard or Compact density for operational applications.

---

# 7. Shape, Borders, and Elevation

## 7.1 Corner radius

The visual language should feel refined and architectural, not overly soft.

| Component | Radius |
|---|---:|
| Buttons | 4–6 px |
| Form fields | 4 px |
| Cards | 6–8 px |
| Dialogs | 8–10 px |
| Image tiles | 0–8 px |
| Status pills | 999 px |
| Large editorial panels | 0–8 px |

Avoid excessive rounded cards.

## 7.2 Borders

Use thin borders:

```css
border: 1px solid #D9D6CE;
```

Gold borders should be restricted to:

- Featured reports
- Executive callouts
- Selected navigation
- Strategic pillar cards
- Presentation dividers

## 7.3 Elevation

Shadows should be subtle.

```css
box-shadow: 0 4px 16px rgba(11, 25, 41, 0.08);
```

```css
box-shadow: 0 12px 36px rgba(11, 25, 41, 0.14);
```

Avoid:

- Heavy black shadows
- Glowing components
- Neon outlines
- Multiple elevation levels on the same page

---

# 8. Imagery

## 8.1 Image subjects

Preferred subjects:

- Recognizable architecture
- Premium interior environments
- Employees performing real work
- Leadership in natural settings
- Technology and operations
- Data centers and infrastructure
- Construction and development
- Community activity
- Sustainability projects
- Culinary and hospitality craftsmanship
- Abstract materials such as stone, glass, metal, textiles, and light

## 8.2 Image treatment

Use:

- Architectural framing
- Strong leading lines
- Natural depth
- Controlled contrast
- Warm highlights
- Neutral shadows
- Authentic environments
- Consistent grade across a campaign

Recommended image ratios:

| Ratio | Use |
|---|---|
| 16:9 | Hero, presentation, video |
| 3:2 | Editorial feature |
| 4:3 | Report and document card |
| 1:1 | Portrait, directory, card |
| 4:5 | Leadership and employee stories |
| 21:9 | Cinematic banner |

## 8.3 People photography

People should appear:

- Competent
- Engaged
- Approachable
- Naturally positioned
- Representative of the workforce
- Connected to the surrounding environment

Avoid:

- Forced handshakes
- Generic boardroom staging
- Artificially diverse stock-photo compositions
- Overly casual imagery in formal governance content
- Employees portrayed as background decoration
- Extreme depth-of-field effects that obscure context

## 8.4 Image overlays

For text over images, use:

- Dark directional gradient
- 50–85% local opacity behind text
- Clear text-safe zones
- White or ivory text
- Gold only as a small accent

Do not place text over a visually complex image without an overlay or dedicated panel.

## 8.5 Image collage pattern

Use controlled collages with:

- One dominant image
- Two to four supporting images
- Consistent crop language
- Shared theme
- Limited overlap
- Clear alignment to the grid

Do not use random masonry layouts.

## 8.6 Prohibited image language

Avoid default use of:

- Slot machines
- Playing cards
- Dice
- Poker chips
- Roulette wheels
- Jackpot graphics
- Neon casino signs
- Promotional nightlife scenes
- Alcohol-focused imagery
- Consumer loyalty cards
- Booking interfaces

These elements may appear only when the business topic explicitly requires them.

---

# 9. Illustration, Iconography, and Diagrams

## 9.1 Icon style

Use:

- Simple line icons
- 1.5–2 px stroke
- Rounded or square terminals consistently
- Minimal internal detail
- Single-color treatment
- 20, 24, or 32 px standard sizes

Approved icon colors:

- Charcoal
- Navy
- White
- Gold for selected emphasis
- Semantic state colors

## 9.2 Icon usage

Icons should clarify:

- Function
- Category
- Status
- Navigation
- Action
- Ownership

Icons should not be decorative substitutes for headings.

Every unfamiliar icon must include a text label or tooltip.

## 9.3 Illustration style

Use illustrations sparingly.

Preferred style:

- Architectural linework
- Geometric abstraction
- Material-inspired patterns
- Data-driven diagrams
- Controlled isometric environments
- Minimal duotone illustrations

Avoid:

- Cartoon mascots
- Casino-themed illustrations
- Highly saturated 3D icons
- Generic corporate blob illustrations
- Hand-drawn effects in formal content

## 9.4 Architecture diagrams

Architecture and process diagrams should use:

- Neutral background
- Navy primary nodes
- Burgundy strategic or external nodes
- Gold control-plane or governance elements
- Teal success paths
- Thin connectors
- Clear directional arrows
- Explicit trust boundaries
- Consistent icon family

Every diagram must include:

- Title
- Scope
- Legend
- Ownership
- Version
- Date
- Assumptions
- Data-flow or process direction

---

# 10. Navigation

## 10.1 Global navigation

Recommended top-level structure:

```text
Company
Strategy
Operations
People
Projects
Insights
Governance
Resources
```

Global utilities:

- Enterprise search
- Notifications
- Application launcher
- Location or business-unit selector
- Profile
- Help
- Language
- Accessibility preferences

## 10.2 Global header

The global header may use:

- Navy or burgundy background
- White navigation labels
- Gold active-state marker
- Compact corporate logo
- 64–80 px total height

Avoid oversized marketing-site headers in operational applications.

## 10.3 Mega menu

A mega menu may contain:

- Featured destination
- Four to six grouped navigation links
- Current initiative
- Featured report
- Business owner
- Frequently used action

Do not place more than approximately 20 actionable links in a single mega menu.

## 10.4 Local navigation

Use persistent local navigation for:

- Governance
- Policies
- Employee services
- Technology standards
- Program documentation
- ESG reporting
- Compliance
- Project portfolios

Preferred pattern:

```text
Section title
Overview
Subsection
Subsection
Subsection
Related resources
Owner and support
```

## 10.5 Breadcrumbs

Use breadcrumbs below the global header for all pages deeper than two levels.

Example:

```text
Operations / Technology / Infrastructure / Data Center Modernization
```

## 10.6 Mobile navigation

Mobile navigation should:

- Preserve search
- Prioritize common tasks
- Collapse secondary links
- Use clear touch targets
- Avoid multi-level hover behavior
- Support back navigation within the menu

---

# 11. Buttons and Actions

## 11.1 Button hierarchy

### Primary

Use navy or burgundy fill with white text.

Examples:

- Submit
- Approve
- Create request
- Publish
- Start review

### Secondary

Use white or transparent fill with navy border.

Examples:

- Save draft
- Preview
- View details
- Compare

### Tertiary

Use text-only action with icon.

Examples:

- Download
- Share
- View history
- Open in new window

### Destructive

Use red only for:

- Delete
- Revoke
- Cancel publication
- Remove access

## 11.2 Button rules

- One primary action per logical area.
- Use verb-first labels.
- Avoid “Click here.”
- Disable unavailable actions with an explanation.
- Do not use gold as the default primary button.
- Do not present more than three adjacent button styles.

---

# 12. Forms and Workflows

## 12.1 Form layout

Preferred form structure:

1. Title and purpose
2. Expected completion time
3. Required context
4. Logical sections
5. Validation
6. Review
7. Submission confirmation

Use one-column forms for complex workflows.

Use two columns only for tightly related fields such as:

- First and last name
- City and postal code
- Start and end date

## 12.2 Field standards

Every field should provide:

- Visible label
- Required or optional state
- Helper text where needed
- Error message
- Correct input type
- Accessible focus state

Do not use placeholder text as the only label.

## 12.3 Workflow visualization

Use a step indicator for:

- Requests
- Approvals
- Onboarding
- Policy attestation
- Procurement
- Publishing
- Access requests

Example:

```text
1. Details → 2. Reviewers → 3. Validation → 4. Submit
```

## 12.4 Confirmation

Confirmation screens should include:

- Submitted item
- Reference number
- Owner
- Expected next step
- Expected service level
- Link to status
- Related action

---

# 13. Cards and Content Modules

## 13.1 Standard card anatomy

A standard card may include:

- Eyebrow
- Title
- Summary
- Image or icon
- Metadata
- Status
- Primary link

Avoid placing more than two actions on a card.

## 13.2 Card types

### Executive feature card

- Large image
- Editorial title
- Short executive summary
- One call to action

### KPI card

- Metric label
- Current value
- Comparison period
- Trend
- Target
- Status

### Document card

- Cover image or file icon
- Title
- Owner
- Publication date
- Version
- Classification
- Open and download actions

### Project card

- Project title
- Sponsor
- Owner
- Status
- Milestone
- Health
- Next decision

### Employee card

- Portrait
- Name
- Role
- Location
- Expertise
- Contact action

### Application card

- App icon
- App name
- Purpose
- Access state
- Launch action
- Support link

---

# 14. Corporate Homepage

## 14.1 Homepage objectives

The internal homepage should help employees:

- Find information
- Complete common tasks
- Understand current priorities
- See relevant corporate news
- Access applications
- Review approvals
- Discover events and learning
- Navigate to business-unit content

## 14.2 Recommended homepage order

1. Utility or emergency banner
2. Global navigation
3. Personalized greeting and enterprise search
4. Priority actions
5. Corporate or departmental hero
6. Company performance strip
7. My work
8. News and announcements
9. Strategic initiatives
10. Events and learning
11. Featured report
12. Employee or community story
13. Application directory
14. Corporate footer

## 14.3 Personalization

Personalization may use:

- Business unit
- Region
- Role
- Location
- Saved applications
- Recent documents
- Assigned tasks
- Followed topics

Users must be able to understand why content is shown and adjust preferences where appropriate.

---

# 15. Dashboard Design

## 15.1 Dashboard hierarchy

A dashboard should answer:

1. What is happening?
2. Is it good or bad?
3. What changed?
4. Why did it change?
5. What requires action?
6. Who owns the action?
7. Where can the user investigate?

## 15.2 Standard dashboard structure

```text
Dashboard title
Scope and data timestamp
Filters
Executive summary
Critical exceptions
Primary KPIs
Trends
Segment comparison
Detailed table
Methodology and source
```

## 15.3 KPI card content

Each KPI should include:

- Metric name
- Current value
- Unit
- Time period
- Comparison
- Target
- Trend
- Status
- Data freshness

## 15.4 Dashboard visual design

Use:

- White or ivory background
- Navy and charcoal text
- Limited accent color
- Compact cards
- Clear chart titles
- Direct labels
- Fine gridlines
- Sticky filters

Avoid:

- Decorative photography
- 3D charts
- Multiple bright colors
- Gauge overload
- Unexplained red and green
- Excessive shadows
- Animated charts on load

---

# 16. Data Visualization

## 16.1 Chart color sequence

Recommended default categorical sequence:

1. Navy
2. Burgundy
3. Teal
4. Slate
5. Gold
6. Blue
7. Amber

Do not rely on color alone.

Use:

- Labels
- Shapes
- Patterns
- Annotations
- Direct values

## 16.2 Chart selection

| Question | Preferred chart |
|---|---|
| Change over time | Line chart |
| Compare categories | Horizontal bar chart |
| Compare actual to target | Bullet chart |
| Show composition | Stacked bar |
| Show distribution | Histogram or box plot |
| Show relationship | Scatter plot |
| Show process conversion | Funnel with exact values |
| Show project schedule | Gantt or milestone timeline |
| Show location | Map with accessible table |
| Show risk | Matrix with labels |

## 16.3 Prohibited or restricted charts

Avoid:

- 3D pie charts
- Exploded pie charts
- Radial gauges
- Speedometer charts
- Decorative infographics without scale
- Maps without a non-map alternative
- Charts with truncated axes unless explicitly disclosed

## 16.4 Table standards

Tables should support:

- Sort
- Filter
- Search
- Sticky header
- Pagination or virtualization
- Column resizing where appropriate
- Export
- Accessible row and column headers
- Responsive mobile behavior

Numeric data should be right-aligned.

Text data should be left-aligned.

---

# 17. Documents and Reports

## 17.1 Report structure

Recommended structure:

1. Cover
2. Executive summary
3. Key metrics
4. Strategic context
5. Findings
6. Detailed analysis
7. Risks and trade-offs
8. Recommendations
9. Roadmap
10. Appendices
11. Definitions and sources

## 17.2 Cover design

Use:

- One dominant architectural or abstract image
- Dark navy or burgundy overlay
- White title
- Gold rule or accent
- Organization name
- Date
- Version
- Classification

Avoid busy image collages on formal report covers unless the report is an annual review.

## 17.3 Interior report pages

Use:

- White or ivory page
- Navy section headings
- Charcoal body text
- Gold fine rules
- Wide margins
- Page numbers
- Version footer
- Controlled callout panels
- Consistent chart language

## 17.4 Document metadata

Every corporate document should include:

- Title
- Owner
- Approver
- Version
- Publication date
- Review date
- Classification
- Status
- Contact
- Source system

## 17.5 Document library

Document cards and search results should expose:

- Title
- Summary
- Type
- Owner
- Version
- Updated date
- Classification
- Language
- Superseded state
- Related content

---

# 18. Presentations

## 18.1 Presentation modes

### Executive presentation

Use:

- Strong narrative
- Large typography
- Minimal content per slide
- High-quality imagery
- One clear message per slide
- Decision-oriented conclusions

### Operational presentation

Use:

- Structured headings
- KPI summaries
- Tables and charts
- Risks and actions
- Clear owners and dates
- Less decorative imagery

### Training presentation

Use:

- Learning objectives
- Progressive disclosure
- Diagrams
- Examples
- Knowledge checks
- Summary slides
- Consistent navigation

## 18.2 Slide dimensions

Default:

```text
16:9 widescreen
1920 × 1080 design canvas
```

## 18.3 Slide structure

Recommended:

- Title area
- Main message
- Supporting evidence
- Source or footnote
- Optional takeaway

## 18.4 Slide types

Build master templates for:

- Title
- Executive statement
- Section divider
- Agenda
- Two-column comparison
- KPI summary
- Chart
- Table
- Timeline
- Architecture diagram
- Quote
- Image feature
- Recommendation
- Decision
- Next steps
- Appendix

## 18.5 Presentation typography

Minimum recommended sizes:

| Element | Minimum |
|---|---:|
| Title | 32 pt |
| Section title | 28 pt |
| Body | 20 pt |
| Labels | 16 pt |
| Footnotes | 11 pt |

## 18.6 Presentation rules

- Use no more than one primary message per slide.
- Avoid paragraphs longer than approximately 50 words.
- Use speaker notes for detail.
- Use gold for emphasis, not entire sentences.
- Use dark slides for title and section transitions.
- Use light slides for data and detailed content.
- Always include source and date for externally derived data.

---

# 19. Email and Messaging

## 19.1 Corporate email design

Email templates should be:

- Single-column
- Responsive
- Accessible
- Maximum 640 px wide
- Primarily light-background
- Limited to one dark hero section
- Built with system-safe fallbacks

## 19.2 Email types

Create templates for:

- Executive announcement
- Weekly corporate update
- Operational alert
- Event invitation
- Training invitation
- Policy publication
- Project status
- Employee recognition
- Newsletter
- Emergency communication

## 19.3 Email structure

```text
Corporate header
Headline
Summary
Primary message
Key actions
Supporting details
Owner or contact
Footer and preferences
```

## 19.4 Email button rules

- One primary CTA above the fold
- Descriptive label
- Minimum 44 px height
- Accessible contrast
- Text-link fallback

## 19.5 Messaging applications

Short messages in Teams, Slack, or equivalent should use:

- Clear opening
- Context
- Required action
- Owner
- Deadline
- Link
- Escalation path

Do not copy long-form email formatting into messaging tools.

---

# 20. Video and Motion

## 20.1 Motion principles

Motion should communicate:

- Scale
- Transition
- Progress
- Hierarchy
- Focus

Motion should not simulate:

- Slot machines
- Flashing signage
- Jackpots
- Gaming interfaces
- Promotional urgency

## 20.2 Motion timing

| Motion | Duration |
|---|---:|
| Button state | 100–150 ms |
| Card hover | 150–200 ms |
| Menu open | 180–250 ms |
| Panel transition | 200–300 ms |
| Hero image reveal | 500–900 ms |
| Presentation transition | 300–600 ms |

## 20.3 Approved effects

- Fade
- Slight vertical rise
- Controlled image zoom
- Divider-line reveal
- Number count-up for selected metrics
- Cross-fade
- Smooth anchor navigation

## 20.4 Video standards

Corporate videos should include:

- Branded opening
- Captions
- Transcript
- Clear title
- Speaker identification
- High-quality audio
- Accessible controls
- Branded closing
- Publication date

Avoid autoplay with sound.

---

# 21. Digital Signage

## 21.1 Signage use cases

- Corporate announcements
- Event schedules
- Executive visits
- Operational notices
- Employee recognition
- Safety messages
- Training reminders
- Community impact
- KPI highlights

## 21.2 Signage layout

Use:

- One message per screen
- Large typography
- High contrast
- Minimal body copy
- Strong visual
- Clear duration
- QR code only when necessary

Recommended viewing assumptions:

```text
Headline: 60–120 px
Supporting text: 28–48 px
Maximum reading time: 6–10 seconds
```

## 21.3 Signage restrictions

Avoid:

- Dense tables
- Small QR codes
- Long URLs
- Rapid animation
- Multiple CTAs
- Critical notices embedded in rotating promotional content

---

# 22. Social and External Corporate Content

## 22.1 Corporate social design

Corporate social assets should use:

- Architectural or employee imagery
- Large headline
- Subtle logo
- Navy or burgundy field
- Gold accent
- Minimal text
- Clear campaign ownership

## 22.2 Standard formats

Create templates for:

- 1:1 square
- 4:5 portrait
- 16:9 landscape
- 9:16 story
- LinkedIn document carousel
- Executive quote
- Event card
- Report launch
- Employee recognition

## 22.3 External corporate tone

External content should emphasize:

- Business outcomes
- Employees
- Innovation
- Responsibility
- Community
- Leadership
- Partnerships

It should avoid consumer promotion unless the campaign explicitly requires it.

---

# 23. Maps and Location Interfaces

## 23.1 Map use cases

- Property portfolio
- Office locations
- Project status
- Community investment
- Operational incidents
- Asset management
- Regional performance

## 23.2 Map standards

Every map should include:

- Search
- Zoom controls
- Legend
- Filter
- Accessible list alternative
- Clear marker state
- Selected-location panel
- Data timestamp

Avoid using gold and burgundy markers that cannot be distinguished by color-blind users.

---

# 24. Search

## 24.1 Enterprise search

Search should support:

- Natural-language queries
- Keyword queries
- Type-ahead suggestions
- Filters
- Recent searches
- Saved searches
- Synonyms
- Acronyms
- Result previews
- Source and owner visibility

## 24.2 Search result card

Include:

- Title
- Summary
- Content type
- Owner
- Updated date
- Business unit
- Classification
- Matching excerpt
- Primary action

## 24.3 Search design

Search should be visually prominent but operationally restrained.

Recommended homepage search:

```text
Large search field
Short instructional prompt
Recent or common tasks
Optional content-type selector
```

---

# 25. Notifications and Alerts

## 25.1 Notification severity

| Level | Use |
|---|---|
| Informational | General update |
| Success | Completed action |
| Warning | Attention required |
| Critical | Immediate response required |
| Emergency | Safety or continuity event |

## 25.2 Alert anatomy

Every alert should include:

- Severity
- Plain-language title
- Description
- Affected audience
- Time
- Owner
- Required action
- Link to details
- Dismissal behavior

Emergency alerts must not rely on color alone.

---

# 26. Accessibility

## 26.1 Target standard

All websites and digital applications should target:

- WCAG 2.2 Level AA
- Keyboard accessibility
- Screen-reader compatibility
- Responsive zoom
- Reduced-motion support
- High-contrast support
- Accessible authentication
- Accessible PDFs and documents

## 26.2 Minimum requirements

- Text contrast of at least 4.5:1 for normal text
- Large-text contrast of at least 3:1
- Visible keyboard focus
- Minimum 44 × 44 px touch targets where practical
- Captions for video
- Transcripts for audio
- Alternative text for meaningful images
- Semantic headings
- Accessible labels
- Error identification
- Skip navigation
- Logical tab order

## 26.3 Gold accessibility risk

Champagne gold frequently fails contrast requirements on white or ivory.

Use gold primarily for:

- Decorative lines
- Large text on dark backgrounds
- Icons accompanied by labels
- Nonessential visual emphasis

Do not use gold as the sole indicator of selection or status.

## 26.4 Motion accessibility

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 27. Responsive Design

## 27.1 Breakpoints

Suggested breakpoints:

```css
--breakpoint-sm: 480px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

## 27.2 Responsive behavior

On smaller screens:

- Collapse multi-column heroes
- Move image after title where appropriate
- Convert mega menus to drill-down navigation
- Stack KPI cards
- Convert large tables to responsive tables or cards
- Preserve priority actions
- Reduce decorative imagery
- Maintain readable line length
- Keep filters accessible

## 27.3 Mobile priorities

Mobile experiences should prioritize:

- Search
- Notifications
- Approvals
- Employee directory
- Support
- Events
- Emergency information
- Common applications
- Status dashboards

---

# 28. Content Design

## 28.1 Voice

Use language that is:

- Direct
- Formal
- Clear
- Specific
- Human
- Outcome-oriented

Avoid:

- Excessive slogans
- Casino metaphors
- Unexplained acronyms
- Empty superlatives
- Vague calls to action
- Promotional urgency
- Internal jargon without definition

## 28.2 Heading style

Preferred:

```text
Modernize core infrastructure
Review quarterly performance
Complete your policy attestation
Understand the operating model
```

Avoid:

```text
Infrastructure Modernization Excellence
Click Here to Learn More
Winning Big with Transformation
Unlock Amazing Opportunities
```

## 28.3 Calls to action

Use verb-first labels:

- Review the report
- Submit the request
- Compare performance
- Contact the owner
- View project status
- Download the standard
- Start the assessment

## 28.4 Dates and numbers

Use consistent formatting.

Recommended:

```text
August 6, 2026
6 Aug 2026 for compact tables
$12.4 million
18.6%
1,250 employees
```

Avoid switching date formats within the same application.

## 28.5 Acronyms

On first use:

```text
Identity and Access Management (IAM)
```

Subsequent uses may use the acronym.

---

# 29. Corporate Templates

## 29.1 Required website templates

Create reusable templates for:

1. Corporate homepage
2. Business-unit homepage
3. Executive landing page
4. Strategy page
5. Transformation program
6. Leadership profile
7. Employee story
8. News article
9. Event
10. Report
11. Document library
12. Policy
13. Project
14. Portfolio
15. Dashboard
16. Data detail
17. Application directory
18. Service catalog
19. Search results
20. Emergency notice

## 29.2 Required communication templates

Create:

- Executive email
- Newsletter
- Operational update
- Alert
- Event invitation
- Policy notice
- Project update
- Employee recognition
- Social post
- Digital signage
- Video title card

## 29.3 Required document templates

Create:

- Executive report
- Technical report
- Strategy memorandum
- Project charter
- Architecture standard
- Policy
- Procedure
- Business case
- Meeting brief
- Decision record
- Annual review

## 29.4 Required presentation templates

Create:

- Executive briefing
- Operating review
- Project kickoff
- Strategy presentation
- Training deck
- Architecture review
- Board or committee update
- Financial review
- ESG report
- Event presentation

---

# 30. Page Pattern Library

## 30.1 Framed cinematic hero

Structure:

```text
Full-width image
Directional dark overlay
Eyebrow label
Short headline
Supporting sentence
One or two actions
```

Use for:

- Corporate homepage
- Strategic initiative
- Executive communication
- Major event

## 30.2 Split editorial hero

Structure:

```text
60% image
40% dark color panel
Large title
Gold rule
Supporting copy
```

Use for:

- Section landing page
- Annual theme
- Program launch
- Leadership message

## 30.3 Executive KPI strip

Structure:

```text
4–6 metrics
Current value
Comparison
Small trend
Source timestamp
```

Use below:

- Homepage hero
- Strategy hero
- Quarterly review
- Program overview

## 30.4 At-a-glance sidebar

Contains:

- Key dates
- Owner
- Scope
- Current status
- Related report
- Contact
- Primary action

Use for:

- Policies
- Projects
- Reports
- Programs
- Governance content

## 30.5 Controlled image collage

Use:

- One large image
- Two supporting images
- Shared subject
- Clean grid
- Minimal text overlay

## 30.6 Editorial long-form page

Contains:

- Narrow reading column
- Large title
- Summary
- Section navigation
- Pull quotes
- Supporting data
- Related resources

## 30.7 Dense operational canvas

Contains:

- Compact header
- Filter bar
- KPI row
- Exception list
- Trend chart
- Detailed table
- Export and subscription

---

# 31. Interaction Standards

## 31.1 Focus

Focus indicators should be:

- Visible
- High contrast
- Consistent
- Not dependent on browser defaults alone

Example:

```css
:focus-visible {
  outline: 3px solid #C5A467;
  outline-offset: 3px;
}
```

Validate contrast against the underlying background.

## 31.2 Hover

Hover may use:

- Slight elevation
- Border change
- Underline
- Image scale up to 1.02
- Color shift

Hover must not be required to discover essential information.

## 31.3 Loading

Use:

- Skeleton states
- Inline progress
- Clear labels
- Estimated step count for long workflows

Avoid:

- Casino-style spinners
- Decorative loading animations
- Unexplained blank states

## 31.4 Empty states

An empty state should explain:

- What the area contains
- Why it is empty
- What the user can do
- Where to get help

## 31.5 Error states

Errors should identify:

- What happened
- What was preserved
- What the user should do
- Whether support is required
- A reference code where applicable

---

# 32. Technical Design Tokens

## 32.1 CSS custom properties

```css
:root {
  --color-navy-950: #0B1929;
  --color-navy-900: #10243E;
  --color-navy-700: #29425C;
  --color-slate-700: #405866;

  --color-burgundy-900: #3D0B10;
  --color-burgundy-700: #5A1016;
  --color-burgundy-500: #82323A;

  --color-gold-600: #A9874E;
  --color-gold-500: #C5A467;
  --color-gold-300: #DEC99F;

  --color-ivory-100: #F5F2EA;
  --color-mist-100: #EDF0F2;
  --color-stone-200: #D9D6CE;

  --color-charcoal-900: #25282A;
  --color-charcoal-700: #4B4F52;
  --color-white: #FFFFFF;

  --color-success: #287C78;
  --color-warning: #B66C25;
  --color-critical: #A13D45;
  --color-information: #326FA8;

  --font-display: "Source Serif 4", Georgia, serif;
  --font-body: "Inter", Arial, sans-serif;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 10px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
  --space-9: 64px;
  --space-10: 80px;
  --space-11: 96px;
  --space-12: 128px;

  --shadow-sm: 0 4px 16px rgba(11, 25, 41, 0.08);
  --shadow-md: 0 12px 36px rgba(11, 25, 41, 0.14);

  --transition-fast: 150ms ease;
  --transition-standard: 220ms ease;
  --transition-slow: 500ms ease;
}
```

## 32.2 Example button

```css
.button-primary {
  appearance: none;
  border: 1px solid var(--color-navy-900);
  border-radius: var(--radius-md);
  background: var(--color-navy-900);
  color: var(--color-white);
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  min-height: 44px;
  padding: 0 var(--space-5);
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.button-primary:hover {
  background: var(--color-navy-700);
  border-color: var(--color-navy-700);
}

.button-primary:active {
  transform: translateY(1px);
}

.button-primary:focus-visible {
  outline: 3px solid var(--color-gold-500);
  outline-offset: 3px;
}
```

## 32.3 Example editorial hero

```css
.editorial-hero {
  position: relative;
  display: grid;
  align-items: end;
  min-height: 620px;
  overflow: hidden;
  background: var(--color-navy-950);
  color: var(--color-white);
}

.editorial-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(11, 25, 41, 0.94) 0%,
    rgba(11, 25, 41, 0.68) 45%,
    rgba(11, 25, 41, 0.10) 100%
  );
}

.editorial-hero__content {
  position: relative;
  z-index: 1;
  max-width: 760px;
  padding: clamp(32px, 6vw, 96px);
}
```

---

# 33. Component Governance

## 33.1 Design-system ownership

Establish the following roles:

| Role | Responsibility |
|---|---|
| Design system owner | Product direction and prioritization |
| Brand lead | Corporate visual integrity |
| UX lead | Usability and interaction |
| Accessibility lead | Standards and testing |
| Engineering lead | Component implementation |
| Content design lead | Voice and terminology |
| Data visualization lead | Chart and reporting standards |
| Governance board | Exceptions and lifecycle decisions |

## 33.2 Component lifecycle

Each component should move through:

```text
Proposed
Experimental
Approved
Deprecated
Retired
```

## 33.3 Component documentation

Every component should document:

- Purpose
- When to use
- When not to use
- Anatomy
- Variants
- States
- Accessibility
- Responsive behavior
- Content guidance
- Code example
- Design source
- Owner
- Version

## 33.4 Exception process

A team requesting an exception should provide:

- Business need
- User need
- Existing component limitation
- Accessibility impact
- Security impact
- Proposed alternative
- Reuse potential
- Sunset plan

---

# 34. Asset Management

## 34.1 Asset library

Maintain a central library for:

- Logos
- Icons
- Photography
- Illustrations
- Presentation templates
- Document templates
- Email modules
- Video graphics
- Social assets
- Digital signage
- UI components
- Design tokens

## 34.2 File naming

Recommended pattern:

```text
<business-unit>_<campaign-or-product>_<asset-type>_<variant>_<language>_v<version>.<ext>
```

Example:

```text
corporate_esg_report-cover_dark_en_v03.png
```

## 34.3 Version control

Do not use:

```text
final
final-final
latest
new
approved-new
```

Use semantic or numeric versions:

```text
v1.0
v1.1
v2.0
```

## 34.4 Image metadata

Store:

- Creator
- Copyright
- Usage rights
- Subject
- Location
- Date
- Campaign
- Expiration
- Consent status
- Alt text
- Keywords

---

# 35. Security, Privacy, and Governance

## 35.1 Classification

Digital content should support classifications such as:

- Public
- Internal
- Confidential
- Restricted

Classification should appear in:

- Documents
- Dashboards
- Reports
- Downloads
- Email
- Exported data
- Screenshots where required

## 35.2 Sensitive data

Avoid placing sensitive information in:

- Hero banners
- Publicly cacheable pages
- Email subject lines
- Push notifications
- URL query strings
- Unprotected downloadable files

## 35.3 Auditability

High-risk workflows should expose:

- Owner
- Approver
- Timestamp
- Status
- History
- Source
- Version
- Reason for change

---

# 36. Quality Assurance

## 36.1 Visual QA

Validate:

- Typography
- Spacing
- Color usage
- Image treatment
- Alignment
- Responsive behavior
- Component consistency
- Dark and light modes if supported

## 36.2 Functional QA

Validate:

- Navigation
- Forms
- Search
- Filters
- Downloads
- Authentication
- Permissions
- Error states
- Session behavior
- Browser compatibility

## 36.3 Accessibility QA

Test:

- Keyboard-only usage
- Screen reader
- Zoom to 200–400%
- High contrast
- Reduced motion
- Color-blind simulation
- Captions
- Form errors
- Focus order
- PDF accessibility

## 36.4 Content QA

Review:

- Accuracy
- Ownership
- Dates
- Links
- Acronyms
- Readability
- Classification
- Translation
- Contact information
- Archival status

## 36.5 Performance targets

Recommended website targets:

| Metric | Target |
|---|---|
| Largest Contentful Paint | Under 2.5 seconds |
| Interaction to Next Paint | Under 200 ms |
| Cumulative Layout Shift | Under 0.1 |
| Initial page weight | As low as practical; target under 2 MB |
| Hero image | Optimized responsive formats |
| JavaScript | Load only required application code |

---

# 37. Design Review Checklist

## Brand

- [ ] Does the asset feel premium, calm, and institutional?
- [ ] Is the design clearly corporate rather than consumer promotional?
- [ ] Are jewel tones and gold used with restraint?
- [ ] Is typography consistent with the design system?
- [ ] Is imagery authentic and relevant?

## Usability

- [ ] Is the primary task obvious?
- [ ] Is there one clear primary action?
- [ ] Is the hierarchy understandable within five seconds?
- [ ] Are navigation and labels predictable?
- [ ] Are empty, loading, error, and success states designed?

## Accessibility

- [ ] Does text meet contrast requirements?
- [ ] Is the experience keyboard accessible?
- [ ] Are focus states visible?
- [ ] Do images include meaningful alt text?
- [ ] Is motion reduced when requested?
- [ ] Are documents accessible?

## Content

- [ ] Is the title specific?
- [ ] Are dates, owners, and status visible?
- [ ] Are acronyms defined?
- [ ] Are calls to action verb-first?
- [ ] Is the content current?
- [ ] Is sensitive information properly classified?

## Technical

- [ ] Is the design responsive?
- [ ] Does it use approved components?
- [ ] Are design tokens implemented?
- [ ] Does it meet performance targets?
- [ ] Is analytics instrumentation defined?
- [ ] Are browser and device requirements tested?

---

# 38. Recommended Implementation Roadmap

## Phase 1: Foundation

Deliver:

- Brand principles
- Color tokens
- Typography
- Spacing
- Iconography
- Image guidelines
- Accessibility baseline
- Initial component inventory

## Phase 2: Core components

Build:

- Header
- Navigation
- Footer
- Buttons
- Forms
- Cards
- Alerts
- Tabs
- Tables
- Dialogs
- Search
- Breadcrumbs
- Pagination

## Phase 3: Corporate patterns

Build:

- Hero patterns
- KPI strip
- Executive feature
- Report card
- Leadership profile
- News card
- Timeline
- At-a-glance panel
- Image collage
- Strategic pillars

## Phase 4: Operational patterns

Build:

- Dashboard shell
- Filters
- KPI cards
- Charts
- Data table
- Workflow
- Approval panel
- Project status
- Risk matrix
- Document library

## Phase 5: Cross-channel templates

Build:

- Presentation masters
- Report templates
- Email templates
- Social templates
- Signage templates
- Video graphics
- Diagram standards

## Phase 6: Governance

Establish:

- Design-system team
- Contribution process
- Release cycle
- Exception review
- Accessibility review
- Asset library
- Training
- Adoption metrics

---

# 39. Success Measures

Measure the design system through:

## Adoption

- Percentage of digital properties using approved components
- Number of duplicated components removed
- Template reuse
- Business units onboarded

## Efficiency

- Design time reduction
- Development time reduction
- Accessibility defects prevented
- Content publishing time
- Asset production time

## Experience

- Search success rate
- Task completion rate
- Time to complete common workflows
- Employee satisfaction
- Mobile completion rate
- Support-ticket reduction

## Governance

- Percentage of content with owner and review date
- Number of expired documents
- Accessibility compliance
- Brand exceptions
- Component deprecation progress

---

# 40. Final Design Direction

The finished ecosystem should present a unified corporate identity across every digital surface.

The intended visual formula is:

```text
Luxury hospitality refinement
+ Institutional credibility
+ Enterprise usability
+ Editorial storytelling
+ Operational clarity
+ Accessible interaction
```

The organization should appear sophisticated and premium when communicating strategy, culture, leadership, and performance.

It should appear precise, efficient, and predictable when employees are completing tasks.

The system succeeds when users experience a consistent corporate environment without feeling that brand expression has compromised speed, clarity, accessibility, or operational effectiveness.
