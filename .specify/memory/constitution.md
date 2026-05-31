<!--
SYNC IMPACT REPORT
==================
Version Change: N/A (template) → 1.0.0 (initial constitution)
Change Type: MAJOR - Initial constitution establishment

Modified Principles:
  - [NEW] I. Browser Extension Architecture - WebExtension standards compliance
  - [NEW] II. TST Integration Contract - Tree Style Tab API compatibility
  - [NEW] III. User Choice & Configurability - Storage-backed user preferences
  - [NEW] IV. Performance & Responsiveness - Tab counter efficiency standards
  - [NEW] V. Backwards Compatibility - Manifest version and API stability

Added Sections:
  + Core Principles (5 principles)
  + Technical Constraints (Platform requirements)
  + Development Standards (Quality gates)
  + Governance (Amendment procedures)

Templates Status:
  ✅ spec-template.md - Updated constitution check reference
  ✅ plan-template.md - Updated constitution check reference
  ✅ tasks-template.md - Verified principle alignment (no changes needed)
  ⚠ Command templates - No command templates found in .specify/templates/commands/

Follow-up TODOs:
  - None - all mandatory fields completed

Notes:
  - RATIFICATION_DATE reflects initial project establishment (estimated from v0.9.9 manifest)
  - Browser extension principles focus on WebExtension standards and TST API compliance
  - Performance targets derived from real-time tab counting requirements
  - User configurability principle reflects popup.html/popup.js implementation
-->

# TST Active and Total Tabs Counter Constitution

## Core Principles

### I. Browser Extension Architecture
Every feature MUST comply with WebExtension standards for Firefox. Code MUST be organized into:
- `background.js` for persistent logic (tab tracking, TST integration, badge rendering)
- `popup.html`/`popup.js` for user-facing configuration UI
- `manifest.json` as the single source of truth for permissions and metadata

**Rationale**: WebExtension architecture ensures cross-browser compatibility, security sandbox compliance, and maintainability. Centralizing tab logic in background script prevents data inconsistencies across windows.

### II. TST Integration Contract
All Tree Style Tab (TST) communication MUST:
- Use the official TST message protocol (`treestyletab@piro.sakura.ne.jp` messaging)
- Register self with `register-self` type and listen to `ready`, `tabbar-updated`, `sidebar-show` events
- Inject CSS via TST's style system (not direct DOM manipulation)
- Gracefully degrade if TST is not available (retry with exponential backoff)

**Rationale**: TST is a hard dependency. Protocol compliance ensures compatibility across TST versions and prevents breaking when TST updates. Graceful degradation improves user experience during transient failures.

### III. User Choice & Configurability
User preferences MUST be stored in `browser.storage.local` and respected immediately. Configuration options MUST include:
- Display rendering method (`nativeBadge` vs `svgRenderBadge`)
- Layout mode (`oneLinePerWindow` vs `compactView`)
- Any future display customizations

**Rationale**: Different users have different workflows (power users with 100+ tabs vs casual users). Storage-backed preferences persist across sessions and enable A/B testing of new features without forcing upgrades.

### IV. Performance & Responsiveness
Tab counting and badge updates MUST:
- Complete within 100ms of tab events (create, remove, discard, activate)
- Handle 1000+ tabs across 10+ windows without UI blocking
- Use efficient tab queries (avoid full tab enumeration per event)
- Batch CSS updates to TST (avoid rapid re-renders)

**Rationale**: Real-time tab counters are performance-critical. Slow updates frustrate users and undermine the extension's core value. Batching prevents TST sidebar thrashing during bulk operations (e.g., "close all tabs in tree").

### V. Backwards Compatibility
Version updates MUST NOT:
- Break existing user configurations (storage schema migrations required if changing keys)
- Remove display options without 2-version deprecation notice
- Change TST message protocol without fallback support
- Require manual user intervention to restore functionality

**Rationale**: Firefox extensions auto-update. Breaking changes frustrate users who didn't opt-in. Manifest V2 deprecation timeline requires forward planning but MUST NOT sacrifice stability.

## Technical Constraints

**Platform**: Firefox 79+ (per `manifest.json` `strict_min_version`)  
**Manifest Version**: Manifest V2 (current), V3 migration planned  
**Required Dependencies**: Tree Style Tab extension (runtime dependency)  
**Permissions**: `storage` (user preferences), implicit tab access via TST protocol  
**Testing Strategy**: Manual QA in Firefox Developer Edition + Nightly (no automated test framework due to WebExtension sandboxing)  
**Deployment**: Mozilla Add-ons (AMO) with automated CI/CD via GitHub Actions  

**Constraints**:
- No external network requests (extension is fully offline)
- No `eval()` or inline scripts (CSP compliance for AMO review)
- SVG badge rendering MUST fit within 128x128 icon dimensions
- All user-facing strings MUST be English (i18n support deferred)

## Development Standards

### Code Quality Gates
- **Linting**: ESLint with Mozilla WebExtension config (warns on deprecated APIs)
- **Manual Testing**: Test matrix covering {1, 2, 5, 10 windows} × {1, 50, 500, 1000 tabs} × {native, SVG badge} × {oneLinePerWindow, compactView}
- **TST Compatibility**: Verify against latest TST stable + beta channels
- **AMO Review**: Zero warnings in AMO validator before submission

### Version Numbering
Use `MAJOR.MINOR.PATCH` format:
- **MAJOR**: Manifest V2→V3 migration, TST protocol breaking changes
- **MINOR**: New display options, UI features, configuration additions
- **PATCH**: Bug fixes, performance improvements, CSS tweaks

### Git Workflow
- **Branching**: Feature branches (`###-feature-name`) off `main`
- **Commit Messages**: Conventional Commits format (`feat:`, `fix:`, `perf:`, `docs:`)
- **Pull Requests**: Require manual QA checklist completion before merge
- **Releases**: Tag in `main` triggers GitHub Actions → AMO upload

## Governance

This constitution defines non-negotiable architectural and quality standards for TST Active and Total Tabs Counter. All feature specifications, implementation plans, and task breakdowns MUST demonstrate compliance with these principles.

**Amendment Process**:
1. Propose amendment in GitHub issue with rationale and impact analysis
2. Update `.specify/memory/constitution.md` with new version number (semantic versioning applies)
3. Audit all templates (`.specify/templates/*.md`) for consistency
4. Update any in-flight feature specs in `specs/` directory
5. Document migration path if amendment introduces breaking changes

**Compliance Verification**:
- All PRs MUST include "Constitution Check" section showing principle adherence
- Complexity exceptions (e.g., workarounds for TST quirks) MUST be justified in `plan.md`
- Automated CI checks MUST enforce linting, manifest validation, and CSP compliance

**Version Control**: This constitution is versioned alongside code. Changes propagate to specification templates to ensure new features inherit updated standards.

**Version**: 1.0.0 | **Ratified**: 2024-01-15 | **Last Amended**: 2025-12-27
