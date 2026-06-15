# Data Visualization UX Reference

Comprehensive guide to designing effective, accessible, and actionable data visualizations and dashboards.

---

## Chart Type Selection Guide

Choosing the right chart type is the most important decision in data visualization.

### Comparison (Values Across Categories)
| Chart | Best For | Avoid When |
|-------|----------|------------|
| **Bar chart (horizontal)** | Comparing 5–15 categories; long labels | >20 categories (use table) |
| **Bar chart (vertical)** | Comparing over time (few periods) | >12 time periods (use line) |
| **Grouped bar** | Comparing sub-categories | >3 groups (too cluttered) |
| **Stacked bar** | Part-to-whole across categories | Precise comparison of segments needed |
| **Diverging bar** | Positive/negative from center | Non-centered baselines |
| **Dot plot** | Precise comparison with many categories | Audience unfamiliar with dot plots |

### Trend Over Time
| Chart | Best For | Avoid When |
|-------|----------|------------|
| **Line chart** | Continuous trends, multiple series | <5 data points |
| **Area chart** | Volume/magnitude over time | Multiple overlapping series |
| **Stacked area** | Part-to-whole trends | Comparing individual segment trends |
| **Sparkline** | Inline trend indicator | Detailed analysis needed |
| **Candlestick** | Financial OHLC data | Non-financial audiences |

### Part-to-Whole
| Chart | Best For | Avoid When |
|-------|----------|------------|
| **Stacked bar (100%)** | Composition across categories | >5 segments per bar |
| **Treemap** | Hierarchical part-to-whole | Precise comparison needed |
| **Donut chart** | 2–3 segments with clear labels | >5 segments (use bar instead) |
| **Pie chart** | Simple 2–3 part comparison | >5 slices, similar-sized slices |
| **Waffle chart** | Percentage out of 100 | Precise values needed |

**Rule:** Never use pie charts for more than 5 categories. Bar charts are almost always better for comparison.

### Distribution
| Chart | Best For | Avoid When |
|-------|----------|------------|
| **Histogram** | Frequency distribution of one variable | Small datasets (<30 points) |
| **Box plot** | Statistical distribution comparison | Non-technical audiences |
| **Violin plot** | Distribution shape comparison | Non-technical audiences |
| **Beeswarm/strip** | Individual data points with distribution | Large datasets (>200 points) |

### Relationship / Correlation
| Chart | Best For | Avoid When |
|-------|----------|------------|
| **Scatter plot** | Two continuous variables | Categorical data |
| **Bubble chart** | Three variables (x, y, size) | Precise size comparison needed |
| **Heatmap** | Correlation matrix or 2D density | >10×10 grid (too dense) |

### Geographic
| Chart | Best For | Avoid When |
|-------|----------|------------|
| **Choropleth map** | Rate/ratio by region | Absolute counts (biased by area size) |
| **Symbol map** | Absolute values by location | Too many overlapping symbols |
| **Cartogram** | Region size by data value | Geographic accuracy needed |

### Decision Flowchart
```
What do you need to show?
├── Compare values → Bar chart
├── Show trend → Line chart
├── Part of whole → Stacked bar (prefer over pie)
├── Distribution → Histogram
├── Relationship → Scatter plot
├── Geographic → Map
└── Precise lookup → Table
```

---

## Color in Data Visualization

### Color Palette Principles
1. **Maximum 6–8 colors** per visualization (cognitive limit).
2. **Sequential palettes** for ordered data (light → dark of one hue).
3. **Diverging palettes** for data with meaningful midpoint (negative ← zero → positive).
4. **Categorical palettes** for unordered categories (distinct, equally prominent hues).
5. **Never rely on color alone** — add patterns, labels, or shapes.

### Accessible Color Palettes
- Test all palette combinations for colorblind accessibility (deuteranopia, protanopia, tritanopia).
- Use tools: ColorBrewer, Viz Palette, IBM Design Language color palettes.
- Minimum 3:1 contrast between adjacent data colors.
- Text on colored backgrounds: 4.5:1 contrast ratio.

### Recommended Palettes
| Type | Example | Use |
|------|---------|-----|
| Sequential | Light blue → Dark blue | Increasing values |
| Diverging | Red ← White → Blue | Above/below average |
| Categorical | 8 distinct hues | Unordered categories |
| Single hue | 5 shades of green | Single metric intensity |

### Color Mistakes
| Mistake | Fix |
|---------|-----|
| Rainbow palette for sequential data | Use single-hue sequential |
| Red-green only for positive/negative | Add blue-orange or patterns |
| Too many colors (>8) | Group categories into "Other" |
| Color with no legend | Always include legend or direct labels |
| Low-contrast data colors | Test with simulators; increase saturation |
| Culturally loaded colors | Red ≠ bad everywhere; consider context |

---

## Tufte's Principles of Graphical Excellence

Source: Edward Tufte, *The Visual Display of Quantitative Information*.

### 1. Graphical Excellence
"Graphical excellence is that which gives to the viewer the greatest number of ideas in the shortest time with the least ink in the smallest space."

### 2. Maximize Data-Ink Ratio
- **Data-ink:** Ink (pixels) that represents data.
- **Non-data-ink:** Gridlines, borders, backgrounds, decorations.
- **Rule:** Maximize data-ink; erase non-data-ink; erase redundant data-ink.

**Application:**
- Remove chart borders and backgrounds.
- Minimize gridlines (light gray, or remove entirely).
- Remove 3D effects (always).
- Direct-label data points instead of legends.
- Remove decorative icons and illustrations from charts.

### 3. Avoid Chartjunk
Decorative elements that don't convey data:
- 3D effects and perspective distortion.
- Heavy gridlines and borders.
- Moiré patterns and textures.
- Ornamental icons in chart areas.
- Gradients and shadows on data elements.

### 4. Small Multiples
Series of similar graphics with same scale, enabling comparison:
- Show change over time as multiple small charts.
- Compare segments side by side with consistent axes.
- More effective than animation for comparison.

### 5. Layering and Separation
- **Figure:** Data layer (foreground).
- **Ground:** Grid and reference layer (background).
- Use white space and subtle gridlines to separate layers.

### 6. Lie Factor
Lie Factor = (size of effect in graphic) / (size of effect in data).

**Rule:** Lie factor should equal 1.0. Never truncate y-axis to exaggerate differences (unless clearly labeled and justified).

### 7. Show Data Variation, Not Design Variation
- Consistent chart types for consistent data types.
- Same scale across comparable charts.
- Don't change visual encoding to "spice up" repetitive data.

---

## Dashboard UX

### Dashboard Design Principles

**1. Answer questions, don't display data.**
Every dashboard element should answer a specific business question. "What is our revenue this month?" not "Here is a revenue chart."

**2. Hierarchy of information.**
```
Top-left (most important): KPIs, alerts, critical metrics
Top-right: Filters, date range, export
Middle: Primary charts and visualizations
Bottom: Supporting detail, tables, secondary metrics
```

**3. 5-Second rule.**
Users should grasp the dashboard's key message within 5 seconds. If they can't, simplify.

**4. One dashboard, one audience.**
Executive dashboard ≠ analyst dashboard. Design for a specific persona and their decisions.

### Dashboard Layout Patterns
| Pattern | Use Case |
|---------|----------|
| **F-pattern** | KPIs top, details below (most common) |
| **Z-pattern** | KPIs top, action items bottom-right |
| **Grid** | Equal-weight metrics (operations monitoring) |
| **Single metric** | One KPI with trend (simplicity) |

### KPI Card Design
```
┌─────────────────────────┐
│ Revenue                 │  ← Metric name (label)
│ $1.2M                   │  ← Current value (large, bold)
│ ▲ 12.3% vs last month  │  ← Trend indicator (color + direction)
│ ━━━━━━━━━━━━━━━━━━━━━  │  ← Sparkline (optional)
└─────────────────────────┘
```

### Dashboard Interaction
- **Global filters:** Date range, region, product — affect all widgets.
- **Drill-down:** Click chart segment to see detail.
- **Cross-filtering:** Select in one chart filters others.
- **Export:** CSV, PDF, image for any data view.
- **Refresh indicator:** Last updated timestamp; auto-refresh for real-time.

### Dashboard Anti-Patterns
| Anti-Pattern | Fix |
|-------------|-----|
| Everything on one page | Multiple focused dashboards |
| 3D charts | 2D only, always |
| Gauges for everything | Numbers with trend indicators |
| No context (number alone) | Add comparison (vs target, vs last period) |
| Auto-rotating widgets | Static layout; user controls |
| Decoration over data | Maximize data-ink ratio |
| Same dashboard for all roles | Role-specific views |

---

## Table vs Chart Decision

### Use a Table When:
- Users need precise values (financial reports, invoices).
- Data has many attributes per item (>5 columns of different types).
- Users need to sort, filter, and search specific records.
- Values don't have meaningful visual patterns.
- Data set is lookup-oriented, not analytical.

### Use a Chart When:
- Users need to see patterns, trends, or comparisons.
- Data has visual structure (time series, categories, distributions).
- The insight is in the shape, not individual values.
- You want to communicate a specific finding quickly.

### Hybrid Approach
- **Chart + table:** Chart for insight, table below for detail.
- **Sparklines in tables:** Trend column in data table.
- **Conditional formatting:** Color cells to highlight patterns in tables.
- **Inline bar charts:** Horizontal bars in table cells for magnitude comparison.

---

## Accessible Data Visualization

### WCAG Requirements for Charts
- **Text alternatives:** `aria-label` or adjacent text describing the chart's key finding.
- **Color contrast:** 3:1 for graphical elements; 4.5:1 for text labels.
- **Don't rely on color alone:** Patterns, shapes, labels, or textures as redundant encoding.
- **Keyboard accessible:** Interactive charts navigable via keyboard.
- **Screen reader support:** Data table alternative for all charts.

### Accessible Chart Techniques
1. **Provide data table alternative** (toggle or below chart).
2. **Direct labeling** instead of legends (reduces color dependency).
3. **Patterns and textures** in addition to color (hatching, dots, stripes).
4. **High contrast mode** support (test with Windows High Contrast).
5. **Sonification** for trend data (experimental but valuable).
6. **Text summary** of key finding above or below chart.

### Accessible Chart Libraries
- **Highcharts** — built-in accessibility module.
- **D3.js** — full control, manual accessibility implementation.
- **Chart.js** — basic accessibility support.
- **Observable Plot** — semantic defaults.
- **Recharts** — React-based; add ARIA manually.

### Testing Accessible Viz
- Navigate chart with keyboard; verify all data points reachable.
- Test with screen reader; verify meaningful description.
- Simulate colorblindness (deuteranopia, protanopia).
- Verify chart is understandable in grayscale.

---

## Real-Time Data Visualization

### Real-Time Dashboard UX
- **Update frequency:** Match refresh rate to decision speed (trading: 1s; ops: 30s; business: 5min).
- **Smooth transitions:** Animate value changes; don't flash/replace entire charts.
- **Pause control:** Let users freeze the view for analysis.
- **Change indicators:** Highlight what changed since last view (flash, color pulse).
- **Connection status:** Show when data is stale or disconnected.

### Real-Time Patterns
| Pattern | Use Case |
|---------|----------|
| Streaming line chart | Continuous metrics (CPU, requests/sec) |
| Counter with animation | Total events, revenue |
| Activity feed | Recent events log |
| Status grid | System health (red/yellow/green) |
| Alert banner | Threshold breaches |

### Performance for Real-Time
- Limit DOM updates (canvas over SVG for >1000 points).
- Throttle rendering to 60fps maximum.
- Aggregate old data (roll up to minute/hour as data ages).
- WebSocket for push; polling as fallback.
- Virtual scrolling for event logs.

---

## Mobile Data Visualization

### Mobile Viz Constraints
- Screen width: 320–414px typical.
- Touch targets: 44px minimum for interactive elements.
- Attention span: shorter; show fewer metrics.
- Network: may be slow; optimize data payload.

### Mobile Viz Patterns
| Desktop | Mobile Adaptation |
|---------|------------------|
| Multi-chart dashboard | Swipeable cards, one chart per card |
| Data table | Card list with key fields |
| Complex chart | Simplified chart + "View details" link |
| Side-by-side comparison | Stacked vertically |
| Hover tooltips | Tap to reveal tooltip |
| Dashboard filters | Bottom sheet filter panel |

### Mobile Chart Rules
1. **One insight per chart** on mobile (not multi-series complexity).
2. **Horizontal bar charts** over vertical (better label readability).
3. **Larger touch targets** on interactive data points.
4. **Simplified axes** — fewer tick marks, rotated labels avoided.
5. **Portrait orientation** as default design.
6. **Swipe between time periods** instead of dense x-axis.

---

## Data Storytelling

### Narrative Structure (Cole Nussbaumer Knaflic)
1. **Hook:** Start with the key insight or question.
2. **Context:** Provide necessary background.
3. **Evidence:** Show supporting visualizations.
4. **Conclusion:** State the finding clearly.
5. **Action:** Recommend what to do next.

### Annotation Best Practices
- **Direct labels** on data points (not separate legends).
- **Reference lines** for targets, averages, thresholds.
- **Callout boxes** for significant events or anomalies.
- **Consistent formatting** across all charts in a narrative.
- **Progressive reveal** in presentations (don't show everything at once).

---

## Sources

- Tufte, E. *The Visual Display of Quantitative Information*. Graphics Press.
- Few, S. *Show Me the Numbers* and *Information Dashboard Design*. Analytics Press.
- Knaflic, C. *Storytelling with Data*. Wiley.
- Cleveland, W. & McGill, R. Graph perception research. *Journal of the American Statistical Association*.
- ColorBrewer. *Color Advice for Cartography*. https://colorbrewer2.org/
- IBM. *Design Language – Data Visualization*. https://www.ibm.com/design/language/data-visualization/
- Google. *Material Design Data Visualization*. https://m3.material.io/styles/icons/overview
- W3C. *WAI Tips for Accessible Charts*. https://www.w3.org/WAI/tutorials/images/complex/
- Highcharts. *Accessibility Module*. https://www.highcharts.com/docs/accessibility/accessibility-module
- Tableau. *Visual Analysis Best Practices*. https://www.tableau.com/learn/whitepapers/tableau-visual-guidebook
