# Relay — Design Architecture

**Companion:** [PROJECT.md](PROJECT.md) — product, engine, pricing, build plan, pitch.

Relay is a physical routing engine for real-world objects. It is not a marketplace, it is not a chat interface, and it is not a blogging platform. We are building a logistics engine that tracks physical state through space and time.

The previous design document aimed for a "paper and ink" look, which inevitably degrades into a serif-heavy, Claude-like imitation. We are abandoning that, as well as the standard "AI startup" slop (purple gradients, glassmorphism) and the over-modernist whitespace vacuums. 

We are adopting an **Industrial Premium / Tactical Logistics** aesthetic. Relay should feel like a piece of high-end hardware, a tactical dashboard, or a Teenage Engineering sequencer. It must feel physical, precise, and unashamedly data-dense.

---

## 1. Core Philosophy: Hardware over Software

1. **Physicality over Flatness:** Interface elements should have clear boundaries. Buttons feel pressable, panels feel inset. Not through soft drop-shadows, but through sharp borders, distinct contrasts, and inner shadows that emulate molded plastic or CNC-milled aluminum.
2. **Signal over Noise:** The interface is dark, matte, and absorbent. Color is emitted only where attention or action is required. Color is light, UI is physical.
3. **Density is Power:** We do not fear density. A logistics coordinator wants all the routing data on one screen. Use grids, tabular layouts, and tight leading to pack information efficiently.

---

## 2. Color System: Tactical Matte & High-Vis

Relay uses a deep, absorbent background with high-visibility signal colors. Color means state.

| Role | Hex | Application |
|---|---|---|
| **Chassis (Bg 1)** | `#0D0E12` | The deepest background layer. Dead space. |
| **Panel (Bg 2)** | `#16181D` | Elevated surfaces, cards, and containers. |
| **Bezel (Border)**| `#2A2D35` | 1px solid structural outlines for all panels. No soft shadows. |
| **Text Primary** | `#E4E7EB` | Main reading text. High contrast, crisp. |
| **Text Muted** | `#828896` | Metadata, disabled states, empty slots. |
| **Active Route** | `#FF5C00` | (High-Vis Orange) — The critical path. Your active handoffs, your next move, primary action buttons. |
| **Secured / Held**| `#00E5FF` | (Electric Cyan) — Item is currently held by someone or a route is confirmed. |
| **Alert / Gap** | `#FFE600` | (Acid Yellow) — A gap in the schedule, an overdue handoff, or a warning. |

*Banned Colors:* Purple, indigo, magenta, soft pastels, gradients of any kind. 

---

## 3. Typography: Structural & Tabular

We use type as scaffolding. It should look technical but highly legible.

1. **Display & Headings: Space Grotesk** (or similar geometric sans like Monument Extended).
   - Used for page titles and big numbers.
   - Weight: Bold/700.
   - Tracking: Tight (-0.03em) to give a solid, blocky feel.
2. **UI & Body: Inter** (tightly tracked) or a sharp Swiss neo-grotesque.
   - For all conversational text and item descriptions.
   - Weight: 400/500.
3. **Data & Logistics: JetBrains Mono** (or Fira Code).
   - This is our most important typeface. Every date, time, price, score, distance, and duration must be monospaced.
   - No proportional figures. Pure tabular lining.

---

## 4. UI Geometry & Physics

- **Border Radius:** `2px` for interactive elements (buttons, inputs), `4px` for outer panels. Sharp, precision-milled corners. No pills, no circles.
- **Borders:** Every logical grouping is bounded by a 1px solid line (`#2A2D35`). We build grids.
- **States:** 
  - `Hover`: Slight brighten of the background.
  - `Active/Pressed`: Inverts the border or engages a 1px inner shadow to feel physically depressed.
- **Transitions:** Snappy. `75ms` to `150ms` max, using linear or sharp ease-out curves. No slow, languid fades. Hardware responds instantly.

---

## 5. The Component Vocabulary

### The Routing Card (The Answer)
The replacement for the generic "marketplace card". It is a logistics receipt.
- **Layout:** A grid-based ticket. 
- **Top Bar:** Electric Cyan dot + "ROUTED" if a chain is found.
- **Middle:** The item description in standard sans.
- **Bottom Matrix:** A monospaced table showing the handoff chain:
  `[YOUR PICKUP] -> [YOUR HOLD] -> [NEXT HANDOFF]`
- **Action:** A full-width, High-Vis Orange button at the bottom: `[ LOCK ROUTE ]`.

### The Timeline Strip
A tactical visualization of an item's term.
- `[=======]`: Electric Cyan bars for held segments.
- `[ · · · ]`: Acid Yellow dots for gaps/idle days.
- `[   ^   ]`: High-Vis Orange chevron pointing to the user's slot.

### The Input Terminal (Need Composer)
Users do not fill out dropdowns. They type into a terminal-like input.
- **Field:** A dark, inset box with a blinking block cursor (not a line cursor).
- **Format:** Free text. "I need a drill on Saturday morning."
- **Feedback:** As they type, small monospaced badges appear below parsing their intent (e.g., `[URGENCY: HIGH]`, `[WINDOW: MORNING]`), powered by the Backboard extraction pipeline.

---

## 6. Motion & A11y
- **Motion is binary.** Elements snap into place. Think of mechanical switches, flip-clocks, and LED matrix displays.
- **Contrast is non-negotiable.** The text must pop against the dark matte background.
- **Keyboard navigation** gets a thick, high-vis orange focus ring. No outline removal.

This is a precision tool for moving physical goods. Design it like one.
