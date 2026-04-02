# Settle Dark Dashboard Design System

## Product Context

- Product: group-based shared expense tracker
- Core screens:
  - нэвтрэх
  - бүртгүүлэх
  - хянах самбар
  - группын жагсаалт
  - группын дэлгэрэнгүй
- All user-facing text must be Mongolian (MN)

## Visual Direction

- Match the reference style from the provided Ayan dashboard images
- Use a dark admin dashboard shell across the authenticated app
- Sidebar should feel dense, vertical, and product-like
- Cards should be clean, low-radius, and compact
- Overall feel: premium operations dashboard, not consumer finance

## Color System

- App background: `#050505`
- Sidebar background: `#080808`
- Surface: `#111111`
- Surface elevated: `#171717`
- Border: `#252525`
- Foreground: `#f3f3f3`
- Muted foreground: `#8d8d8d`
- Gold accent: `#c8af79`
- Gold foreground: `#17130a`
- Success/active: `#10c79a`
- Danger: `#ff4d57`
- Neutral chart/secondary: `#5f6674`

## Typography

- Sans serif only
- Titles: bold, modern, compact
- Body: clean UI sans
- No serif headings

## Layout Conventions

- Desktop:
  - narrow left icon rail
  - wider text sidebar panel
  - main content surface on the right
- Mobile:
  - collapse to icon-first navigation
  - preserve dark shell and card rhythm
- Header actions should stay compact and right-aligned

## Components

- Sidebar active item: dark chip with subtle border and stronger text
- Primary button: gold background with dark text
- Secondary/utility buttons: dark surface with border
- Inputs: dark surface, muted placeholder, thin border
- Cards: almost-black surface with subtle outline
- Tables/lists: minimal separators, compact rows
- Badges: use green for positive/active and red for debt/negative

## Content Rules

- All labels, buttons, empty states, helper copy, and section titles are Mongolian
- Financial values remain numeric with `MNT` or `₮`
- Use concise operational wording

## Motion

- Minimal transitions only
- No decorative animations
