# Fonts Directory

This directory contains custom font files needed for the Public_Terminal app.

## Required Font Files

Place the following font files in this directory:

1. **comic-sans.woff2** and **comic-sans.woff**
   - Font family: Comic Sans MS
   - Used for UI text and buttons

2. **wingdings.woff2** and **wingdings.woff**
   - Font family: Wingdings
   - Used for the pixel art wingdings rendering

## How to Obtain Font Files

### Option 1: Convert from System Fonts (Recommended)
If you have the fonts installed on your system, you can use online conversion tools:
- Visit https://font-converter.online/ or similar
- Upload the .ttf or .otf files from your system
- Convert to WOFF2 and WOFF formats
- Save to this directory

### Option 2: Use Font Services
- Download from Google Fonts (limited availability)
- Use commercial font services
- Purchase licenses if needed

## File Format Support

The `@font-face` rules in `globals.css` reference both WOFF2 (modern, smaller) and WOFF (fallback) formats.
Ensure you have both formats for maximum compatibility:
- WOFF2: Modern format, ~60% smaller than WOFF
- WOFF: Fallback for older browsers

## Notes

- Font files are served from the public directory and are downloadable by users
- Consider licensing restrictions when using these fonts
- The `font-display: swap` property ensures text is visible even if fonts are slow to load
