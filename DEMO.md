# Scope Analysis — Demo Cheat Sheet
**March 19, 2026 — Progress Meeting with Todd & Adam**

---

## 1. Estimator Sidebar
**Point:** "Clean, focused, no risk language"

- Three links only: **Compare Erectors** · **Erector vs MFC** · **MFC Exclusions**
- Risk data, Sessions, High Risk, Train → all still exist, admin-gated
- Nothing was removed — everything was added and gated by role

## 2. Compare Erectors Flow
**Point:** "Upload scope letters, get a side-by-side matrix"

- **Start:** Tools → Compare Erectors → New Comparison
- Upload 2+ PDFs, name each erector, enter job info
- 3-phase pipeline: Analyze → Group → Complete (progress card polls live)
- **Matrix view:**
    - Rows = unified items grouped by category
    - Columns = erectors
    - Cells = Excludes (green) / Includes (blue) / Not Mentioned (gray)
- **Key features to show:**
    - **Segmented toggle:** "All Items (45) / Gaps & Differences (12)" — live counts
    - **Column highlight dropdown:** pick an erector, others dim
    - **Expand a row:** shows each erector's raw wording stacked
    - Uncategorized erector items are captured (not silently dropped)

## 3. Select Erector → Review
**Point:** "Comparison feeds into individual review"

- From ComparisonDetailPage → select an erector via dropdown
- Selection banner appears, progress card tracks analysis if needed
- Navigate to **Erector vs MFC** → opens the review with `showRisk=false`
- Same match data as Sessions, just no risk badges/confidence/risk notes
- Action items section says "Coverage Gaps" not "Critical & High Risk"

## 4. The Editor
**Point:** "Matches the Word template, interactive editing"

- Open from any review detail → "Open in Editor" button
- **Formatting parity:** 0.75" margins, Shruti 12pt, hanging indents, tab stops via Canvas measureText
- **Highlights:** color-coded regions by match type (aligned/partial/erector-only/MFC-only)
- **Interactions:** click region → detail sidebar, remove region (X), remove paragraph (gutter), restore
- **Toolbar:** stats bar + Remove Unmatched + Export .docx
- **Export endpoint:** applies removed paragraphs, removed regions, text edits, respects view mode

## 5. Admin View
**Point:** "All the data is still here, nothing was stripped"

- Switch to admin account (or show sidebar difference)
- **Sessions tab** — full risk badges, confidence scores, action items with risk sections
- **High Risk tab** — cross-session risk aggregation, unchanged
- **Train tab** — admin-only

---

## Questions to Ask

1. Comparison matrix — any other visualization? Export to Excel or PDF?
2. Editor colors — confirm green/yellow/red/locked model, or simpler?
3. NeverRemove — which MFC exclusions should be locked? (only safety cable rail flagged so far)
4. Template Health — still wanted as a future feature, or shelved?
5. What does the ideal "done" state look like for the estimator day-to-day workflow?