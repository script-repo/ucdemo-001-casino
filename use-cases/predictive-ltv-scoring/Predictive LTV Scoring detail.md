# Predictive LTV Scoring  
## User Experience and Technical Architecture Specification

## Current implementation status

The supplied README describes this application as **planned**, with only a scaffolded UI and no functioning model or backend. The proposed application predicts a player’s forward twelve-month value using carded gaming, hotel, and food-and-beverage activity.

The business objective is to move player reinvestment decisions away from trailing historical value and toward predicted future value. The design changes ranking from four broad tiers to a property-level percentile and allows rising players to be recognized during the next scoring cycle rather than much later.

---

# 1. Personas

| Persona | Primary responsibility | Main question |
|---|---|---|
| Player host | Manages individual player relationships | “What should I know before contacting this player?” |
| Player development manager | Prioritizes host effort and reinvestment | “Which players should the team focus on?” |
| Model analyst or data scientist | Validates and releases scoring models | “Can this model be trusted and promoted?” |
| Property executive or finance leader | Oversees reinvestment effectiveness | “Are we allocating attention and budget toward future value?” |
| Data or platform operator | Maintains data, scoring jobs, APIs, and reliability | “Is the application operating on complete and current data?” |

---

# 2. Five user flows

The first three flows extend the flows defined in the design document. The final two are recommended additions required for a complete production application.

## Flow 1 — Weekly reinvestment review

**Persona:** Player development manager  
**Frequency:** Weekly  
**Objective:** Build a defensible list of high-value and rising players.

1. The manager opens **Predictive LTV Scoring**.
2. The freshness banner confirms:
   - The last successful scoring time.
   - The active model version.
   - Whether the scoring process is healthy.
3. The application selects a default view such as:
   - Property: manager’s assigned property.
   - Percentile: top 10%.
   - Player status: active.
4. The manager changes the percentile filter to `90–100`.
5. The manager sorts by **value trend** to surface rapidly rising players.
6. The manager optionally narrows the list by:
   - Tier.
   - Last visit.
   - Property.
   - Host assignment.
7. The manager opens several player detail panels to understand why each player is ranked highly.
8. The manager saves the cohort as a named view, such as **Top rising players — August review**.
9. The manager exports the approved cohort to downstream campaign or reinvestment tooling.
10. The system records:
    - Filters used.
    - Exporting user.
    - Export timestamp.
    - Model version.
    - Score date.

**Outcome:** A traceable, current, explainable cohort for the weekly reinvestment cycle.

**Exception handling:** If scores are more than 36 hours old, the manager sees a warning and must acknowledge the stale data before exporting.

---

## Flow 2 — Pre-call player lookup

**Persona:** Player host  
**Frequency:** Daily  
**Objective:** Understand a player before making contact.

1. The host enters from the host-management or customer-management system through a deep link.
2. The selected player is automatically opened in the score detail panel.
3. The host sees a plain-language summary:

> Expected twelve-month value: $218,450  
> This player ranks in the top 4% at this property.  
> The estimate is most likely between $176,200 and $265,100.

4. The host reviews the top positive and negative drivers.
5. The application translates technical features into operational language:
   - Visits increased over the last six months.
   - Non-gaming spending increased.
   - Average gaming value per visit declined.
6. The host reviews:
   - Last visit.
   - Trend.
   - Score freshness.
   - Data completeness.
7. The host opens the player record in the source customer-management system for contact history and other personally identifiable information.
8. The host records the resulting action in the existing host-management workflow.

**Outcome:** The host enters the conversation with a defensible estimate and an understandable explanation.

**Exception handling:** Players with fewer than three carded visits receive no score. The application explains that there is insufficient history rather than displaying a misleading estimate. The source design explicitly requires this refusal-to-score behavior.

---

## Flow 3 — Model release and acceptance

**Persona:** Model analyst or data scientist  
**Frequency:** Per model release  
**Objective:** Determine whether a candidate model can replace the current production model.

1. The analyst opens **Model validation mode**.
2. The application displays:
   - Candidate model.
   - Current production model.
   - Training period.
   - Evaluation period.
   - Number of training and evaluation records.
3. The analyst reviews the calibration panel.
4. Each prediction decile is compared with actual observed value.
5. The system flags every decile outside the ±15% acceptance band.
6. The analyst compares:
   - Candidate calibration.
   - Current-model calibration.
   - Score distribution.
   - Population coverage.
   - Refusal-to-score rate.
7. The analyst reviews data-quality and drift checks.
8. If the candidate meets the acceptance criteria, the analyst selects **Approve for promotion**.
9. A second authorized reviewer approves the release.
10. MLflow marks the candidate as the production model.
11. The next scoring run uses the new model.
12. The previous production model remains available for rollback.

**Outcome:** A governed, human-approved model promotion with a recoverable previous state.

Calibration is especially important because a model that ranks players correctly but systematically predicts too high will overspend the reinvestment budget.

---

## Flow 4 — Executive portfolio review

**Persona:** Property executive or finance leader  
**Frequency:** Monthly or quarterly  
**Objective:** Understand expected player value and reinvestment exposure at a portfolio level.

1. The executive opens an **Executive summary** rather than the detailed host view.
2. The application shows:
   - Total predicted twelve-month value.
   - Change from the prior scoring period.
   - Number of players in the top 10%.
   - Number of rising players.
   - Number of players without sufficient scoring history.
   - Model calibration status.
3. The executive compares properties or operating regions.
4. The executive selects a property to see:
   - Value distribution.
   - Tier migration.
   - Rising and declining cohorts.
   - Concentration risk.
5. The executive reviews whether reinvestment spending is aligned with predicted value.
6. Exceptions are surfaced, such as:
   - Large predicted-value movement.
   - Calibration degradation.
   - Abnormal numbers of unscored players.
7. The executive downloads a governed summary report or opens the relevant management workflow.

**Outcome:** Executive understanding of future player value without requiring exposure to model-engineering details.

**Constraint:** The model currently produces predicted value, but the business rule mapping predicted value to an appropriate reinvestment amount remains undefined. The interface must not imply that the score itself is an approved offer amount.

---

## Flow 5 — Scoring failure investigation

**Persona:** Data or platform operator  
**Frequency:** Exception-driven  
**Objective:** Restore scoring without publishing incomplete or invalid data.

1. Monitoring detects one of the following:
   - Nightly scoring did not complete.
   - Source row count changed by more than 10%.
   - Schema validation failed.
   - Calibration moved outside the accepted range.
   - API health checks failed.
2. The operator receives an alert containing:
   - Failure type.
   - Affected scoring run.
   - Model version.
   - Dataset date.
   - Correlation or job ID.
3. The operator opens the operational view from the freshness banner.
4. The application displays the pipeline stages:
   - Source extraction.
   - Feature creation.
   - Model loading.
   - Scoring.
   - Database write.
   - Calibration validation.
5. The operator reviews logs and data-quality checks.
6. The system prevents partial results from replacing the last valid score set.
7. The operator corrects the issue and manually starts a new scoring job.
8. The system validates the new result before atomically marking it current.
9. The freshness banner returns to healthy.
10. The incident and remediation are recorded in the audit log.

**Outcome:** The last known valid score set remains available while the failed run is investigated.

The source design already specifies stale-score warnings, calibration alarms, row-count protections, score refusal, and dependency sequencing between LTV and churn scoring.

---

# 3. Five user stories

## Story 1 — Player host

**As a player host,** I want to see a player’s expected future value and the reasons behind it, **so that** I can prepare for a conversation without needing to understand machine-learning terminology.

### Acceptance criteria

- The player summary is written in plain language.
- The score includes its likely range, property percentile, timestamp, and data quality.
- The three most influential positive and negative factors are shown.
- Every factor has a human-readable explanation.
- A link opens the authoritative customer-management record.
- The application clearly states that the estimate is not a guaranteed outcome or automatic offer recommendation.

---

## Story 2 — Player development manager

**As a player development manager,** I want to identify high-value and rapidly rising players, **so that** I can prioritize host activity and reinvestment reviews.

### Acceptance criteria

- The cohort can be filtered by percentile, property, tier, last visit, trend, and status.
- The table can be sorted, searched, paginated, and exported.
- Active filters are clearly visible.
- The number of matching players and the score date are always displayed.
- Saved views can be reused.
- Exports include the model version and score timestamp.
- Stale data cannot be exported without an explicit warning.

---

## Story 3 — Model analyst

**As a model analyst,** I want to compare predicted and actual outcomes by decile, **so that** I can determine whether a model is sufficiently calibrated for production.

### Acceptance criteria

- Actual and predicted values are displayed by decile.
- The ±15% acceptance band is visible.
- Out-of-band deciles are listed explicitly and not indicated by color alone.
- Candidate and current-production models can be compared.
- Model promotion requires authorization and an audit record.
- The prior model remains recoverable.
- The model cannot be automatically promoted solely because an aggregate metric passes.

---

## Story 4 — Property executive

**As a property executive,** I want a summarized view of predicted player value and its movement, **so that** I can understand expected portfolio performance without reviewing individual records.

### Acceptance criteria

- The executive receives summary metrics rather than the detailed modeling view.
- Metrics include scope, period, comparison, status, and freshness.
- The executive can compare properties.
- Material changes and exceptions are called out in plain language.
- The executive can drill into a cohort but cannot see unnecessary player information.
- The interface differentiates prediction from approved reinvestment policy.

---

## Story 5 — Platform operator

**As a platform operator,** I want scoring failures and data-quality problems to be visible and diagnosable, **so that** invalid scores are never silently published.

### Acceptance criteria

- Every scoring run has a unique job ID.
- Pipeline-stage status and logs are accessible.
- A run with abnormal source counts is stopped before publication.
- Failed runs do not overwrite the last successful scores.
- Operators can manually restart scoring.
- Alerts contain an owner, severity, timestamp, and required action.
- Recovery is confirmed through API, database, and UI health checks.

---

# 4. Detailed explanation of the UI

The design defines six core application components: freshness banner, cohort table, player score detail, driver bars, calibration panel, and cohort export.

## 4.1 Global header

### Contents

- Corporate portal identity.
- Help.
- Notifications.
- User profile.
- Team or role.
- Potential property or business-unit selector.

### Purpose

The global header establishes that the application is part of the larger internal AI platform. It also provides cross-application utilities and identity context.

### Required behavior

- Help should be contextual to the current page.
- Notifications should distinguish application events from operational incidents.
- The user menu should expose:
  - Role.
  - Property scope.
  - Accessibility preferences.
  - Sign-out.
- A visible classification such as **Internal** or **Restricted** should be added because the interface contains sensitive player analytics.

---

## 4.2 Left navigation

### Contents

- Dashboard.
- Use Cases.
- Predictive LTV Scoring.
- Related use cases such as churn risk and next-best action.
- Models.
- Cohorts.
- Exports.
- Governance.
- Settings.

### Purpose

The left navigation provides persistent local navigation across the AI portal.

### Recommended improvement

Add a breadcrumb above the page title:

```text
Use Cases / Player Development / Predictive LTV Scoring
```

The corporate design standard recommends breadcrumbs for pages deeper than two levels and expects navigation to expose related resources, ownership, and support.

---

## 4.3 Page title and description

### Current function

The title identifies the application. The subtitle explains that players are ranked by predicted twelve-month forward value.

### Required improvement

“LTV” should not be the primary label for novice users. Recommended title:

```text
Expected Player Value
```

Secondary text may say:

```text
Predictive lifetime value scoring
```

Recommended description:

> Estimate each player’s gaming and non-gaming value over the next twelve months and understand the factors influencing the estimate.

This explains the outcome without assuming the user understands LTV, theoretical win, or predictive modeling.

---

## 4.4 Page actions

### Current actions

- Refresh Scores.
- View Model.
- Export Cohort.

### Purpose

- **Refresh Scores:** Manually initiates a scoring process.
- **View Model:** Opens model documentation and validation information.
- **Export Cohort:** Downloads the currently filtered population.

### Problems

1. The current gold-filled **Export Cohort** button conflicts with the design guide, which states that gold should not be the default primary button on a light background.
2. Different personas need different primary actions.
3. Refreshing scores is an operator action and should not be exposed to every user.
4. “View Model” is not meaningful to most hosts.

The design standard recommends one primary action per logical area, verb-first labels, explanations for disabled actions, and navy or burgundy for primary buttons.

### Recommended role-based actions

| Persona | Primary action |
|---|---|
| Host | Open player record |
| PD manager | Create cohort |
| Analyst | Review model validation |
| Operator | Run scoring job |
| Executive | Download summary |

---

## 4.5 Score freshness banner

### Current contents

- “Scores are up to date.”
- Last-scored time.
- Model version.
- Training-data date.
- Health status.

### Purpose

The banner answers whether the user can trust the displayed information operationally.

### Required behavior

- Green/teal: scoring completed successfully and data is current.
- Amber: scores are older than the expected threshold.
- Red: scoring failed or data failed validation.
- Neutral: scoring is in progress.
- Every status must include text and an icon, not only color.
- Expanding the banner should show:
  - Source-data date.
  - Scoring start and end times.
  - Records processed.
  - Records skipped.
  - Failure or warning reason.
  - Support owner.

### Plain-language wording

Replace:

```text
Model version: mlflow:run:8f2c1d7
```

With:

```text
Scoring method: Version 2.4
Technical ID: mlflow:run:8f2c1d7
```

Keep the technical identifier behind progressive disclosure.

---

## 4.6 Filters and search

### Current filters

- Percentile range.
- Tier.
- Property.
- Last-visit window.
- Player ID search.

### Purpose

The filters define the cohort shown in the table.

### Required improvements

- Show applied filters as removable chips.
- Include **Clear all**.
- Explain the number of results before export.
- Provide common presets:
  - Top 10% by expected value.
  - Rising players.
  - Recently active high-value players.
  - Declining established players.
  - Players without sufficient history.
- Allow users to save and name a view.
- Preserve filter state when opening and closing player detail.
- Display the comparison scope:

```text
Percentile is calculated among players at Las Vegas property.
```

### Player search limitation

The scoring API intentionally carries player ID and tier rather than names or contact details; personally identifying data remains in the customer-management system.

Therefore, zero-friction search should be delivered through one of these patterns:

1. Deep-link into the application from the customer-management record.
2. Secure federated search against the customer-management system.
3. A separate authorized player-directory API.

The scoring service should not become a duplicate player directory.

---

## 4.7 Cohort summary

### Current content

```text
Showing 1–10 of 15,842 players
```

### Recommended additions

- Score date.
- Property scope.
- Number of players excluded for insufficient history.
- Current sort order.
- Active saved view.
- Export eligibility.

Example:

> 15,842 scored players at Las Vegas, using data through August 5.  
> 418 players were not scored because they had fewer than three recorded visits.

---

## 4.8 Cohort table

### Current columns

- Player ID.
- Predicted twelve-month value.
- Percentile.
- Tier.
- Last visit.
- Trend.
- Status.

### Purpose

The table ranks players and supports cohort investigation.

### Detailed column meaning

| Column | Meaning | Recommended novice label |
|---|---|---|
| Player ID | Authoritative identifier | Player |
| Predicted 12M Value | Expected gaming and non-gaming value | Expected value—next 12 months |
| Percentile | Rank within the property | Property rank |
| Tier | Current loyalty tier | Current tier |
| Last Visit | Most recent recorded visit | Last visit |
| Trend | Direction of score movement | Expected value change |
| Status | Operational player state | Player activity |

### Required table behavior

- Sticky header.
- Sort and filter.
- Keyboard navigation.
- Pagination or virtualization.
- Resizable columns where appropriate.
- Export.
- Accessible row and column headers.
- Right-aligned numeric values.
- Text and icons in addition to semantic colors.

These behaviors align with the corporate data-table standard.

### Important ambiguity

“Status” is insufficiently specific. It could refer to:

- Player activity.
- Host relationship.
- Loyalty account.
- Model eligibility.
- Data quality.

Rename it explicitly to **Player activity** or split it into separate fields.

---

## 4.9 Player score detail

### Current contents

- Selected player.
- Property and tier.
- Predicted value.
- Percentile.
- Prediction interval.
- Last-scored timestamp.
- Model version.
- Model type.

### Purpose

The panel explains one selected result without navigating away from the cohort.

### Recommended primary summary

> This player is expected to generate approximately **$218,450** in gaming and non-gaming value during the next twelve months. They rank higher than **96% of players at this property**. Based on available data, the likely range is **$176,200–$265,100**.

### Required caveats

- Prediction, not guarantee.
- Intended to support—not replace—host judgment.
- Not an automatic offer or reinvestment amount.
- Based only on recorded carded activity.
- Missing or uncarded activity may not be represented.

### Progressive disclosure

Hosts should see business meaning first. Analysts may expand:

- Model release.
- Feature snapshot date.
- Prediction interval method.
- Model type.
- Technical model identifier.

---

## 4.10 Score drivers

### Current contents

Positive and negative feature contributions such as:

- Visits up 40% over six months.
- Higher non-gaming spend.
- Recent visit frequency improving.
- Average theoretical value per visit declining.

### Purpose

Drivers explain why the model produced its estimate.

The source design states that this is not optional; hosts are unlikely to trust or use a number they cannot explain.

### Required improvements

- Replace “Score Drivers” with **Why this estimate changed**.
- Explain the comparison basis:

```text
Compared with players who have similar activity histories.
```

- Separate:
  - Factors increasing the estimate.
  - Factors decreasing the estimate.
- Display data period beside each factor.
- Add an explanation for every domain term.
- Do not imply causation. Use wording such as:
  - “Associated with a higher estimate.”
  - Not “Caused the player’s value to increase.”
- Provide **View supporting activity** to open the underlying summarized evidence.

---

## 4.11 Calibration panel

### Current contents

- Actual versus predicted value.
- Ten percentile groups or deciles.
- ±15% acceptance band.
- Weighted mean absolute percentage error.
- Number of passing deciles.

### Purpose

The panel determines whether the model’s monetary predictions align with observed outcomes.

### Appropriate audience

- Data scientists.
- Model validators.
- Finance analysts.
- Governance reviewers.

### Inappropriate default audience

Most hosts and operational managers do not need to see this panel.

### Recommended design

Create two views:

**Business view**

> Prediction quality is acceptable.  
> Eight of ten player groups were within the approved tolerance.

**Analyst view**

- Decile chart.
- Error metrics.
- Sample counts.
- Evaluation dates.
- Candidate/current comparison.
- Drift and coverage details.

### Plain-language definitions

| Technical term | Plain-language equivalent |
|---|---|
| Calibration | How closely predictions match eventual results |
| Decile | One group containing approximately 10% of players |
| ±15% band | Approved prediction tolerance |
| Weighted MAPE | Average percentage prediction error |
| Actual normalized value | Observed value adjusted for comparison |
| Predicted normalized value | Model estimate adjusted for comparison |

---

## 4.12 “How to use these scores” card

### Purpose

This card should provide concise operational guidance.

### Recommended content

**Use this score to:**

- Prioritize player review.
- Identify rising or declining value.
- Prepare for host conversations.
- Build cohorts for governed downstream workflows.

**Do not use this score to:**

- Guarantee future player behavior.
- Automatically determine an offer.
- Replace responsible-gaming controls.
- Replace host judgment.
- Infer unrecorded activity.

This is more useful than a generic “Learn more” link.

---

## 4.13 Data timestamp and auto-refresh

### Current contents

- Data-as-of timestamp.
- Auto-refresh state.

### Required behavior

- Use the user’s property-local timezone.
- Explain whether auto-refresh changes only the screen or reruns the model.
- Preserve selected filters during refresh.
- Warn before replacing an open detail panel.
- Show the timestamp in both human-friendly and exact form:

```text
Updated today at 2:00 a.m. ET
August 6, 2026 02:00:00 ET
```

---

## 4.14 Missing UI states

The production design must explicitly include:

- First-use state.
- Loading state.
- Empty cohort.
- No matching results.
- Player not found.
- Player has insufficient history.
- Stale scores.
- Scoring in progress.
- Partial upstream data.
- API unavailable.
- Export processing.
- Export complete.
- Permission denied.
- Model under review.
- Model rollback in progress.

The corporate design checklist requires clear empty, loading, error, and success states and expects the primary task to be understandable within five seconds.

---

# 5. Required backing infrastructure

## 5.1 Logical data flow

```text
Casino management and hospitality source systems
    │
    ├── Patron records
    ├── Carded sessions
    ├── Slot play
    ├── Table ratings
    ├── Trips
    ├── Hotel stays
    └── Food-and-beverage transactions
    │
    ▼
Read-only analytics ingestion / curated data layer
    │
    ▼
Feature-generation job
    │
    ├── Feature snapshots
    └── Data-quality checks
    │
    ▼
Weekly model-training job
    │
    ├── Gradient-boosted regression
    ├── Time-based validation
    ├── Isotonic calibration
    └── MLflow model registration
    │
    ▼
Nightly scoring job
    │
    ├── Player score
    ├── Property percentile
    ├── Prediction interval
    ├── Driver contributions
    └── Scoring metadata
    │
    ▼
Analytics database
    │
    ├── analytics.player_scores
    ├── uc_predictive_ltv.feature_snapshot
    └── uc_predictive_ltv.calibration
    │
    ▼
FastAPI scoring service
    │
    ▼
Internal AI portal
    │
    ├── Host view
    ├── Manager view
    ├── Executive view
    ├── Analyst view
    └── Operator view
```

The source design reads patron, card-session, slot-play, table-rating, trip, hotel-stay, and food-and-beverage data. It writes the calculated LTV, percentile, model version, and scoring timestamp to `analytics.player_scores`.

---

## 5.2 Infrastructure components

| Layer | Required components | Function |
|---|---|---|
| Experience | React or equivalent SPA, portal shell, responsive design system | Renders persona-specific UI |
| Identity | Enterprise SSO using OIDC or SAML, MFA, role and property claims | Authenticates users and constrains access |
| API | FastAPI deployment with at least two replicas | Serves scores, drivers, calibration, and health |
| API gateway | Internal ingress, TLS, rate limiting, authentication enforcement | Secures and exposes APIs |
| Transactional analytics database | Highly available PostgreSQL-compatible service | Stores scores, feature snapshots, calibration, metadata |
| Source integration | CDC, ETL/ELT, or scheduled extracts from source systems | Produces governed read-only analytics data |
| Model training | Kubernetes Job | Trains and validates candidate models |
| Batch scoring | Kubernetes CronJob | Scores all eligible carded players nightly |
| Model registry | MLflow tracking server and registry | Tracks experiments and governs model releases |
| Artifact storage | S3-compatible object storage | Stores model artifacts, calibration files, and reports |
| Orchestration | Kubernetes scheduler and workflow dependencies | Sequences ingestion, scoring, validation, and downstream jobs |
| Observability | Metrics, logs, traces, dashboards, alerting | Detects stale data and failures |
| Secrets | Enterprise secrets manager | Protects database, API, and object-store credentials |
| Export service | Asynchronous export worker and secure temporary storage | Produces governed CSV files |
| Audit | Immutable or append-only audit events | Tracks access, exports, refreshes, and promotions |
| Backup and recovery | Database backup, artifact versioning, cluster recovery | Protects scores and model history |

---

## 5.3 Kubernetes workload topology

The source design identifies three primary workloads:

| Workload | Kubernetes object | Schedule | Source sizing |
|---|---|---|---|
| `ltv-train` | Job | Weekly and manually initiated | Approximately 4 CPU and 8 GiB |
| `ltv-score` | CronJob | Nightly at 02:00 | Not specified; validate through load testing |
| `predictive-ltv-scoring` | Deployment | Continuous | Two replicas, approximately 200m CPU and 512 MiB each |

The source expects a 50,000-player, 24-month training dataset to fit in a single training pod; distributed model training is not required at that scale.

### Recommended additional workloads

```text
portal-frontend
mlflow-server
export-worker
data-quality-validator
calibration-validator
pipeline-controller
audit-event-writer
```

### Kubernetes controls

- Pod disruption budgets.
- Anti-affinity for API replicas.
- Network policies.
- Read-only container filesystems.
- Non-root execution.
- Resource requests and limits.
- Horizontal pod autoscaling for the API.
- CronJob concurrency policy set to `Forbid`.
- Deadlines and retry limits for jobs.
- Separate service accounts for training, scoring, API, and export.
- Signed container images.
- Admission policies.
- Persistent volumes only where required.

This can be deployed on any conformant enterprise Kubernetes platform. On a Nutanix implementation, NKP can supply the Kubernetes control plane, while NUS object services or an S3-compatible service can provide model-artifact storage and NDB or another managed PostgreSQL platform can provide the database layer.

---

## 5.4 Data and database design

### Source-aligned tables

```text
analytics.player_scores
uc_predictive_ltv.feature_snapshot
uc_predictive_ltv.calibration
```

### Recommended additional tables

```text
uc_predictive_ltv.scoring_run
uc_predictive_ltv.score_driver
uc_predictive_ltv.model_release
uc_predictive_ltv.data_quality_result
uc_predictive_ltv.export_audit
uc_predictive_ltv.saved_cohort
```

### Publication pattern

A nightly run should not update production rows one player at a time. Use:

1. A versioned staging table.
2. Full-run validation.
3. Row-count and schema checks.
4. Calibration and coverage checks.
5. An atomic pointer or transaction to mark the run current.

This prevents users from seeing a partially completed scoring population.

---

## 5.5 API services

The source design defines health, cohort, player score, driver, calibration, current-model, and manual-refresh endpoints.

### Required API domains

```text
GET  /health
GET  /scores
GET  /players/{player_id}/score
GET  /players/{player_id}/drivers
GET  /model/calibration
GET  /model/current
POST /scores/refresh
```

### Recommended additions

```text
GET  /runs/current
GET  /runs/{run_id}
GET  /scores/summary
GET  /scores/presets
POST /cohorts
GET  /cohorts/{cohort_id}
POST /exports
GET  /exports/{export_id}
GET  /glossary
GET  /help/context
POST /model/{model_version}/approval
POST /model/{model_version}/rollback
```

### API controls

- Cursor-based pagination.
- Maximum export size.
- Query timeouts.
- Field-level authorization.
- Property-scoped claims.
- Audit correlation IDs.
- Idempotency keys for refresh and export requests.
- OpenAPI documentation restricted to authorized engineering roles.
- Versioned contracts.

---

## 5.6 ML and model-management infrastructure

### Training

- Forward-looking twelve-month label.
- Time-based train and validation split.
- Gradient-boosted regression.
- Isotonic calibration.
- Feature and label snapshotting.
- Reproducible environment and package lock.
- Training-data lineage.
- Model signature and schema validation.

### Registry

MLflow should store:

- Model artifact.
- Model hyperparameters.
- Feature definitions.
- Training-data period.
- Evaluation period.
- Calibration results.
- Approval state.
- Approvers.
- Production and rollback aliases.

### Explainability

The driver service needs either:

- Precomputed feature contributions stored during scoring, or
- On-demand contributions using a model-specific explainability method.

Precomputation is preferable because it provides:

- Faster user response.
- Reproducibility.
- Exact alignment with the score version.
- Easier audit and rollback.

---

## 5.7 Security and privacy

### Identity and access

Suggested roles:

```text
ltv-host
ltv-manager
ltv-executive
ltv-analyst
ltv-model-approver
ltv-operator
ltv-auditor
```

Access should be scoped by:

- Property.
- Region.
- Business unit.
- Assigned player portfolio where appropriate.

### Data minimization

- Keep names, addresses, contact information, and sensitive player details in the authoritative customer-management system.
- Use player identifiers inside the scoring service.
- Do not include unnecessary personally identifying information in exports.
- Apply short expiration times to exported files.
- Watermark or classify exports.
- Audit every export and individual-player lookup.

### Encryption

- TLS in transit.
- Database and object-storage encryption at rest.
- Managed encryption keys.
- Credential rotation.
- No static credentials inside images or manifests.

### Responsible use

The source design does not place a responsible-gaming gate inside this scoring service because it does not directly generate player-facing output; downstream consumers are expected to apply the relevant gate.

The portal should nevertheless show whether a player is restricted from downstream activation without revealing unnecessary sensitive reasons.

---

## 5.8 Observability and operational controls

### Metrics

- Last successful source ingestion.
- Last successful scoring.
- Players processed.
- Players scored.
- Players refused.
- Scoring duration.
- API latency and error rate.
- Calibration by decile.
- Distribution drift.
- Feature null rates.
- Export volume.
- User task completion.

### Alerts

- Scoring older than 36 hours.
- Source count change greater than 10%.
- API health failure.
- Database replication or storage issue.
- Calibration outside tolerance.
- Unexpected increase in unscored players.
- Missing source dataset.
- Model artifact unavailable.
- Export failure.

### Logs and traces

Use structured logs containing:

```text
run_id
model_version
score_date
property_id
stage
record_count
duration
status
correlation_id
```

Avoid logging raw player data.

---

## 5.9 Availability and recovery

### Minimum availability design

- Two API replicas.
- Two frontend replicas.
- Highly available database.
- Replicated object storage.
- Multiple Kubernetes worker nodes.
- Pod anti-affinity.
- Health and readiness probes.
- Rolling updates.
- Last-known-good score set remains readable during failures.

### Recovery objectives

Suggested initial targets:

| Component | Suggested RPO | Suggested RTO |
|---|---:|---:|
| Current scores | 24 hours | 2 hours |
| Saved cohorts and audit data | 15 minutes | 2 hours |
| MLflow metadata | 1 hour | 4 hours |
| Model artifacts | Near-zero through replication/versioning | 4 hours |
| Portal/API | Stateless | 30 minutes |

These are architectural starting points and require business validation.

---

# 6. Improvements required for zero prerequisite knowledge

## 6.1 Replace technical terminology

| Current term | Recommended default wording |
|---|---|
| Predictive LTV | Expected player value |
| Predicted 12M value | Expected value over the next 12 months |
| Percentile 96 | Ranks higher than 96% of players at this property |
| Interval 80% | Likely range |
| Theo | Expected gaming revenue |
| Score driver | Reason influencing the estimate |
| Calibration | How closely predictions match actual results |
| Decile | Group representing 10% of players |
| Weighted MAPE | Average prediction error |
| Model version | Scoring-method version |
| Training data through | The latest historical data used to build the scoring method |
| Scored at | When this estimate was last calculated |

Technical terminology can remain available in analyst mode.

---

## 6.2 Introduce a task-first landing experience

Instead of opening directly into a dense table, first ask:

> What are you trying to do?

Provide four large actions:

1. **Prepare a player conversation**
2. **Find players to prioritize**
3. **Review prediction quality**
4. **Check system health**

The selected task configures the interface, filters, help text, and primary action.

---

## 6.3 Create role-specific views

### Host view

- Player search or direct link.
- Plain-language player summary.
- Top reasons.
- Source-system link.
- Minimal model information.

### Manager view

- Cohort presets.
- Filters and table.
- Saved views.
- Export workflow.
- Team assignment.

### Executive view

- Aggregated KPIs.
- Property comparison.
- Exceptions.
- Trends.
- No individual records by default.

### Analyst view

- Calibration.
- Drift.
- Model comparisons.
- Data coverage.
- Promotion workflow.

### Operator view

- Pipeline status.
- Job logs.
- Data-quality results.
- Manual rerun.
- Incident information.

This removes irrelevant complexity rather than expecting every user to understand every panel.

---

## 6.4 Add a plain-language summary to every player

The detail panel should begin with a generated but deterministic narrative:

> This player is expected to generate approximately **$218,450** over the next twelve months and ranks in the **top 4%** at this property. The estimate increased primarily because visits and non-gaming spending rose. Average gaming value per visit declined. This is a prediction, not a guaranteed outcome or approved reinvestment amount.

The narrative should be assembled from structured data, not generated freely by an unrestricted language model.

---

## 6.5 Explain what the score does and does not represent

Place an expandable explanation beside the score:

### Included

- Recorded carded gaming.
- Hotel stays.
- Food-and-beverage transactions.
- Visit frequency.
- Recent activity trends.

### Not included or potentially incomplete

- Uncarded activity.
- External activity.
- Unrecorded host context.
- Future events not present in historical data.
- An approved offer or reinvestment rule.

---

## 6.6 Separate prediction from recommended action

The current design risks users interpreting predicted value as an approved reinvestment amount.

Until the business defines a reinvestment mapping, display:

> No reinvestment recommendation has been configured. Use this estimate as one input into the existing approval process.

Once policy exists, the application can separately display:

```text
Expected player value
Approved reinvestment range
Current reinvestment
Variance from policy
Required approval
```

The two concepts must never be merged into one number.

---

## 6.7 Add embedded definitions

Every unfamiliar label should provide:

- Plain-language definition.
- Why it matters.
- How it is calculated at a high level.
- Comparison scope.
- Data timestamp.
- Link to detailed methodology.

Example:

**Property rank**

> Shows how this player’s expected value compares with other scored players at the selected property. A rank of 96 means the player is above 96% of that population.

The design guide explicitly states that unfamiliar icons require labels or tooltips and that unexplained acronyms and internal jargon should be avoided. 
---

## 6.8 Use progressive disclosure

### Default host experience

Show:

- Expected value.
- Property rank.
- Likely range.
- Trend.
- Reasons.
- Data freshness.

### Expanded details

Show:

- Feature contributions.
- Technical identifiers.
- Model type.
- Training period.
- Calibration.
- Evaluation metrics.

This keeps the interface self-explanatory without removing transparency.

---

## 6.9 Make insufficient-history states educational

Do not show a blank value or generic error.

Use:

> We cannot calculate a reliable estimate yet. This player has two recorded visits; at least three are required.

Also provide:

- Recorded visit count.
- Data-through date.
- Source-system link.
- Whether a future score is expected.
- Explanation that withholding an unreliable estimate is intentional.

---

## 6.10 Add guided cohort creation

Replace unrestricted filtering as the only method with a simple flow:

```text
1. Choose objective
2. Choose property and population
3. Review matching players
4. Confirm exclusions
5. Save or export
```

Objective choices could include:

- Highest expected value.
- Fastest-rising expected value.
- Recently active high-value players.
- Declining high-value players.
- Players needing manual review.

The corporate guide recommends workflows that clearly state purpose, expected effort, required context, validation, review, and confirmation.

---

## 6.11 Improve export safety

Before download, show a review page containing:

- Cohort name.
- Number of records.
- Filters.
- Property.
- Score date.
- Model version.
- Included columns.
- Data classification.
- Intended downstream use.
- Export expiration.
- User acknowledgement.

For large exports, use an asynchronous process and notify the user when the encrypted file is ready.

---

## 6.12 Add transparent comparison context

Every rank and trend must specify:

- Compared with whom.
- Over what period.
- At which property.
- Whether the population changed.
- Whether the model changed.

Example:

> Rank calculated among 15,842 eligible players at Las Vegas using scores generated August 6.

Without this, a percentile or trend can be misinterpreted.

---

## 6.13 Add “What changed?” explanations

When a player’s score moves materially, explain whether the change came from:

- New player activity.
- Older activity falling outside the observation window.
- A new scoring model.
- Updated or corrected source data.
- A changed property comparison population.

This prevents users from assuming all movement represents new player behavior.

---

## 6.14 Improve accessibility

- Do not rely on red, teal, or gold alone.
- Add icons and textual status.
- Support keyboard interaction throughout.
- Make the player detail panel a correctly announced dialog or complementary region.
- Provide accessible chart summaries.
- Offer a tabular alternative to the calibration chart.
- Support 200% zoom.
- Respect reduced-motion preferences.
- Maintain visible focus.
- Use at least 44×44-pixel touch targets where practical.
- Test against WCAG 2.2 AA.

The design standard explicitly targets WCAG 2.2 AA, keyboard access, screen readers, zoom, reduced motion, and high contrast.

---

## 6.15 Add contextual support

Every page should expose:

- **About this page**
- **How to complete this task**
- **Definitions**
- **Data and methodology**
- **Contact the owner**
- **Report a data problem**

Support requests should automatically include:

- Page.
- Player or cohort identifier where authorized.
- Score date.
- Model version.
- Correlation ID.
- User role.
- Browser information.

---

## 6.16 Use measurable usability targets

Recommended product success criteria:

| Measure | Initial target |
|---|---:|
| First-time user identifies primary task | Within 5 seconds |
| Host finds and understands a player score | Under 30 seconds |
| Manager creates a top-value cohort | Under 2 minutes |
| Users requiring formal training | Less than 10% |
| Successful cohort exports | Greater than 99% |
| Tasks completed without help content | Greater than 85% |
| Score-related terminology questions | Declining month over month |
| Accessibility-critical defects | Zero |
| Stale score usage without acknowledgement | Zero |
| Support tickets per 100 active users | Declining after each release |

The broader design guide recommends measuring task completion, workflow time, employee satisfaction, mobile completion, and support-ticket reduction.

---

# 7. Highest-priority design changes

## Priority 0 — Before usability testing

1. Rename the page to **Expected Player Value**.
2. Add task-first and persona-specific views.
3. Replace jargon in the default experience.
4. Add a narrative explanation to the player detail.
5. Distinguish prediction from reinvestment recommendation.
6. Add explicit no-score and stale-score states.
7. Change the gold primary button to navy or burgundy.
8. Hide calibration details from hosts by default.
9. Clarify percentile scope and trend period.
10. Add a secure customer-management deep link.

## Priority 1 — Before production pilot

1. Saved cohort views.
2. Guided export workflow.
3. Role and property-based authorization.
4. Audit logs.
5. Model promotion workflow.
6. Embedded glossary and contextual help.
7. Accessible chart alternatives.
8. Full operational status and support path.
9. End-to-end telemetry.
10. Data-quality and drift visualization.

## Priority 2 — After the initial pilot

1. Natural-language cohort queries with governed translation into filters.
2. Side-by-side player or cohort comparison.
3. Manager-approved cohort sharing.
4. Automated explanations of material score changes.
5. Integration with host task assignment.
6. Policy-based reinvestment guidance after the business rule is formally defined.

---

# 8. Recommended final interaction model

```text
User opens the application
    │
    ▼
Application recognizes role and property
    │
    ▼
User selects a task or resumes recent work
    │
    ▼
Application shows only information required for that task
    │
    ▼
Every prediction is explained in plain language
    │
    ▼
Uncertainty, freshness, and limitations remain visible
    │
    ▼
User performs a governed business action
    │
    ▼
Application records the data, model, user, and decision context
```

The goal should not be to teach every host machine learning. The goal should be to make the correct operational interpretation obvious while keeping detailed methodology available to analysts, validators, and auditors.