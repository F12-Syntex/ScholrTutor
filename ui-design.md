# Design System Specification: The Polished Monolith

## 1. Overview & Creative North Star: "Organic Permanence"
This design system departs from the aggressive, machined edges of traditional "Tactile Editorial" and evolves into a state of **Organic Permanence**. Imagine the interface not as a digital screen, but as a collection of obsidian river stones and heavy, molded glass—objects that have been smoothed by time but retain an imposing, monolithic weight.

**The Creative North Star:** We are building a "Digital Sanctuary." By leveraging high-radius curvatures (1.5rem+) and deep tonal shifts, we move away from "app-like" templates and toward a "gallery-like" experience. We reject the rigid 1px grid in favor of breathing room, soft-touch surfaces, and intentional asymmetry that feels curated, not generated.

---

## 2. Color & Surface Architecture
Color is not just a fill; it is a material property. We use a dark, sophisticated palette to simulate depth and light absorption.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface_container_low` section sitting on a `surface` background provides all the separation required.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following tiers to create "nested" depth:
- **Base Layer:** `surface` (#0e0e11)
- **Secondary Sectioning:** `surface_container_low` (#131317)
- **Primary Content Cards:** `surface_container` (#19191f)
- **Elevated Interactivity:** `surface_container_high` (#1f1f26)

### The "Glass & Gradient" Rule
To achieve the "Polished Stone" look, use subtle radial gradients on main surfaces (e.g., transitioning from `primary` to `primary_container` at a 5% opacity) to simulate a light leak hitting a curved edge. For floating overlays, use **Glassmorphism**: 
- **Fill:** `surface_variant` at 60% opacity.
- **Effect:** 20px Backdrop Blur.
- **Edge:** A "Ghost Border" using `outline_variant` at 15% opacity.

---

## 3. Typography: The Editorial Voice
Our typography balances the classical authority of a serif with the technical precision of a geometric sans-serif.

*   **Display & Headlines (Newsreader):** Use for storytelling and high-level hierarchy. The soft terminals of Newsreader complement our new 1.5rem corner radii. Use `display-lg` (3.5rem) for hero moments with tighter letter-spacing (-0.02em) to emphasize the "Monolith" feel.
*   **Body & UI (Space Grotesk):** Use for utility and data. Its monolinear, wide stance provides a technical contrast to the romanticism of the headlines.
*   **The Hierarchy Identity:** Always lead with a Newsreader `headline-sm` before transitioning into Space Grotesk `body-md`. This pairing signals "Expertise + Technology."

---

## 4. Elevation & Depth: Modern Skeuomorphism
We do not use drop shadows to make things "pop"; we use them to simulate environmental light.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface_container_lowest` (#000000) card inside a `surface_container` (#19191f) area to create a "recessed" or carved-in effect.
*   **Ambient Shadows:** For floating elements, use a "Cloud Shadow":
    - **Blur:** 40px to 60px.
    - **Opacity:** 4% - 8% of `on_surface`.
    - **Offset:** Y: 12px (to simulate a high light source).
*   **Inner Tonal Shifts:** To create the "Molded" feel, apply a 1px inner glow to the top edge of cards using `primary` at 10% opacity. This mimics light catching the "lip" of a rounded stone.

---

## 5. Components

### Buttons (The "River Stone" Form)
- **Primary:** Background `primary` (#c6c6ca), Text `on_primary`. Radius: `full` (9999px) for a pill shape. 
- **Secondary:** Background `surface_container_highest`, Text `on_surface`. Radius: `md` (1.5rem).
- **Tactile State:** On hover, apply a subtle inner shadow (`inset 0 2px 4px rgba(0,0,0,0.4)`) to make the button feel like it is being physically pressed into the surface.

### Input Fields (The "Carved" Form)
- **Structure:** Background `surface_container_low`, Radius `md` (1.5rem).
- **Border:** No border. Use a 1px inset shadow to simulate depth.
- **Focus State:** Transition background to `surface_container_high` and change the "Ghost Border" opacity to 40%.

### Cards (The "Monolith" Form)
- **Radius:** `lg` (2rem) or `xl` (3rem) for large layout blocks.
- **Separation:** Strictly forbid divider lines. Use `spacing-8` (2.75rem) to separate content chunks within the card.
- **Nesting:** Small chips or tags inside cards must use `full` radius to contrast against the `lg` radius of the parent.

### Chips & Tags
- **Style:** `surface_bright` background with `label-md` (Space Grotesk). 
- **Radius:** `full`. These should feel like small, polished pebbles.

---

## 6. Do’s and Don’ts

### Do:
- **Use Asymmetry:** Place a `display-lg` headline off-center to create a bespoke, editorial feel.
- **Embrace Negative Space:** Use `spacing-16` (5.5rem) or `spacing-20` (7rem) between major sections to let the rounded forms breathe.
- **Tone-on-Tone:** Use `primary_dim` text on `primary_container` backgrounds for secondary information to maintain a "low-energy" sophisticated vibe.

### Don't:
- **Don't use 1px solid borders.** This shatters the illusion of molded physical objects.
- **Don't use pure white (#FFFFFF).** Use `tertiary` (#e4ebff) or `on_surface` (#e6e4ef) to maintain the cinematic, low-light atmosphere.
- **Don't mix radii haphazardly.** Stick to `md` (1.5rem) for UI elements and `full` for buttons/chips. Never use the old 0.25rem radius.

### Accessibility Note:
While we emphasize tonal shifts over borders, ensure that the contrast ratio between `surface` and `surface_container_high` meets a minimum of 3:1 for structural UI, and text remains compliant at 4.5:1 using the `on_surface` tokens.