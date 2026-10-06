/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#20302d',
    tint: '#c95f4d',

    // Core surfaces
    background: '#f6f3ed',
    foreground: '#20302d',

    // Cards / elevated surfaces
    card: '#fffdf9',
    cardForeground: '#20302d',

    // Primary action color (buttons, links, active states)
    primary: '#c95f4d',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e9eee9',
    secondaryForeground: '#2e3d38',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#ece8e0',
    mutedForeground: '#737971',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#f1d28b',
    accentForeground: '#3b3526',

    // Destructive actions (delete, error states)
    destructive: '#b44842',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e4ded4',
    input: '#ded8ce',
  },

  dark: {
    text: '#f0ede5',
    tint: '#ee8b70',
    background: '#15201e',
    foreground: '#f0ede5',
    card: '#202c29',
    cardForeground: '#f0ede5',
    primary: '#ee8b70',
    primaryForeground: '#2c211e',
    secondary: '#283531',
    secondaryForeground: '#e5eae3',
    muted: '#27332f',
    mutedForeground: '#aab4aa',
    accent: '#ddbd72',
    accentForeground: '#272319',
    destructive: '#d67469',
    destructiveForeground: '#241d1b',
    border: '#35413c',
    input: '#3b4842',
  },

  radius: 18,
};

export default colors;
