# Design System Document

## 1. Overview & Creative North Star: "The Culinary Curator"

This design system is built to transcend the "generic food app" template. Our Creative North Star is **"The Culinary Curator"**—a philosophy that treats digital interfaces like a high-end physical menu or a curated dining space. We move away from rigid, boxed-in layouts in favor of an editorial experience that breathes. 

The aesthetic is driven by **Soft Minimalism**: high-contrast typography scales, intentional asymmetry in image placement, and a total reliance on tonal depth rather than structural lines. This system creates an appetizing environment where the food is the protagonist, supported by a sophisticated, "barely-there" interface.

---

## 2. Colors: The Appetizing Palette

We utilize a palette of "Warm Orange" and "Soft White" to stimulate appetite while maintaining a professional, premium feel.

### Core Palette (Material Design Tokens)
*   **Primary (`#a83900`):** Our "Signature Heat." Used for key actions and branding.
*   **Surface (`#fbf9f7`):** Our "Soft White." A warm, creamy neutral that prevents the clinical feel of pure hex #FFFFFF.
*   **Secondary (`#77574d`):** A sophisticated earth tone for supporting elements.
*   **Tertiary (`#006972`):** A cool teal used sparingly to provide visual "freshness" and contrast.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts.
*   *Example:* A `surface-container-low` section sitting directly on a `surface` background provides all the separation necessary. If you feel the need to draw a line, instead increase the whitespace or shift the tonal tier.

### The "Glass & Gradient" Rule
To add "soul" to the digital interface:
*   **Signature Textures:** Use subtle linear gradients for Hero headers or Primary Buttons, transitioning from `primary` (#a83900) to `primary_container` (#ff7135).
*   **Glassmorphism:** For floating navigation bars or "Quick Add" modals, use semi-transparent `surface` colors with a 20px backdrop-blur. This makes the UI feel like fine glassware on a linen tablecloth.

---

### 3. Typography: Editorial Authority

We use a pairing of **Plus Jakarta Sans** for character and **Inter** for utility.

*   **Display (Plus Jakarta Sans):** Large, bold, and expressive. Used for promotional headers (e.g., "Penawaran Hari Ini").
*   **Headline (Plus Jakarta Sans):** Medium weight, generous letter spacing. Used for category titles.
*   **Body & Title (Inter):** High legibility for menus and descriptions.
*   **Labels (Inter):** Used for micro-copy and tags (e.g., "Pedas," "Vegetarian").

**Hierarchy Tip:** Always skip a weight or size to create "dramatic" hierarchy. If your headline is `headline-lg`, your subtext should be `body-md` to create an editorial, high-end feel.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are often "dirty." We use **Ambient Light** principles.

*   **The Layering Principle:** Stack surfaces like sheets of paper. Place a `surface_container_lowest` card on top of a `surface_container_low` background. The subtle difference in hex code creates a natural lift.
*   **Ambient Shadows:** If a card must float (e.g., a featured dish), use a shadow with a 24px-32px blur and only 4-6% opacity. The shadow color should be a tint of `on_surface` (#1b1c1b), never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components: The Building Blocks

### Buttons (Tombol)
*   **Primary:** `primary` background, `on_primary` (white) text. Roundedness: `full`. Use a slight gradient for depth.
    *   *Label:* "Pesan Sekarang"
*   **Secondary:** `secondary_container` background. No border.
    *   *Label:* "Tambah ke Keranjang"

### Cards (Kartu Menu)
Cards must never have borders. Use `surface_container_lowest` for the card body against a `surface` background. 
*   **Radius:** Always use `xl` (1.5rem) for main product cards to evoke a friendly, modern feel.
*   **Imagery:** Images should "bleed" to the top edge of the card or be offset asymmetrically to break the grid.

### Chips (Tag)
*   Used for food categories or dietary filters (e.g., "Halal," "Populer").
*   **Style:** `surface_container_high` with `on_surface_variant` text. High roundedness (`full`).

### Input Fields (Kolom Input)
*   **Style:** Minimalist. Only a `surface_container_highest` background with no border. 
*   **Interaction:** On focus, the background stays the same, but a 2px `primary` underline or soft outer glow appears.
*   *Label:* "Alamat Pengiriman"

### Forbid Dividers
In lists (Daftar Pesanan), do not use horizontal lines. Use **vertical white space** (24px - 32px) to separate items. If separation is visually required, use a subtle background tint change for every second item.

---

## 6. Do's and Don'ts

### Do
*   **Use Indonesian Naturally:** Use "Pesan" instead of "Order," "Riwayat" instead of "History."
*   **Embrace Negative Space:** If a screen feels "empty," it’s likely working. Let the typography and food photography breathe.
*   **Use Tonal Shifts:** Always use the `surface-container` hierarchy to define importance before reaching for a shadow.

### Don't
*   **Don't use 1px borders:** This is the quickest way to make a premium design look like a basic template.
*   **Don't use pure black (#000000):** Use `on_surface` (#1b1c1b) for text to maintain the "Soft White" warmth.
*   **Don't crowd the cards:** A card shouldn't have more than 3 levels of information (Title, Price, One-line description).

### Indonesia-Specific Context Labels:
*   **CTA:** "Bayar Sekarang" (Pay Now)
*   **Status:** "Sedang Disiapkan" (Being Prepared)
*   **Empty State:** "Meja Anda masih kosong." (Your table/cart is still empty.)