# HealthAI dashboard design system

Direction: minimal health-tech dashboard, adapted from ui-ux-pro-max Minimalism & Swiss Style. Generated landing-page patterns were rejected as unsuitable for an authenticated dashboard.

## Tokens
Canvas #F4F7F8; surface #FFFFFF; text #182B36; secondary #526571; primary #176B70; primary tint #EFF7F6; border #DFE7EA. Warning and danger colors are reserved for meaningful status. Typography: existing Plus Jakarta Sans, including numbers; 16px base, 14px supporting text, 12px minimum metadata, 24–32px page titles. Spacing: 4, 8, 12, 16, 24, 32px. Cards: 16px radius, 24px padding, subtle border/shadow. Controls: minimum 44px height, visible focus, reduced motion.

## Existing problems
Small 10–11px metadata; competing blue, orange, pink and green accents; decorative welcome panel outranks measurements; weekly BMI history absent from overview; chart-only presentation inaccessible to some users.

## Information architecture
1. Compact personalized welcome and measure action.
2. Current BMI, heart rate, oxygen and activity metrics, with data provenance.
3. Weekly BMI trend alongside the existing weekly check-in.
4. Local environment: temperature, humidity, UV and AQI.
5. Existing rule-based recommendations and health chat.

Desktop: persistent navigation, four metric columns, two-column trend/check-in and environment/recommendations. Mobile: drawer navigation, single-column sections in identical reading order. No new business rules, invented readings, fake controls or altered clinical thresholds.

## Accessibility
Semantic headings, skip link, labeled controls, decorative SVGs hidden, textual statuses, chart data table, keyboard focus, reduced-motion support. Keep Vietnamese interface and existing demo labels.
