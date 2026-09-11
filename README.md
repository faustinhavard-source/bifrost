# QIAO — robotics founders programme

A single-screen English landing page for the Zurich-to-Shenzhen robotics programme, based on the Partner Brief supplied on 11 September 2026.

- Provisional name: QIAO.
- Source: https://app.notion.com/p/entrepreneursfirst/Partner-Brief-Zurich-to-Shenzhen-3d7e26adb8c9818d9686f1f9edda90aa
- Contact destination, explicitly supplied by the user: automations-thebridge@joinef.com.
- Content: 45 European robotics builders; Zurich, 7–18 December 2026; Shenzhen, 25 January–4 February 2027; Entrepreneurs First and Pluto House.
- Prices, unsupported superlatives, previous-cohort performance, availability claims and Chinese New Year references have intentionally been left out of this concise first page.

## Files

The site is authored directly in `dist/`. It requires no compilation and no external JavaScript or font service.

## Typography

The reference uses **New Mercat**, by Toormix: https://toormix.com/ca/projecte/new-mercat . No New Mercat font file or licence was supplied. This first version uses **VT323** by Peter Hull with a horizontal scanline treatment, as a visual approximation. VT323 is distributed under the SIL Open Font License; the licence is included in `dist/assets/FONT-LICENSE.txt`.

To use the exact reference typeface, supply a properly licensed New Mercat webfont and replace the `Terminal` font-face declaration in `dist/styles.css`, then check headline widths again.

## Behaviour

Contact links open the visitor's email application with the QIAO subject. They do not send anything automatically. The page uses a viewport-sized layout, with compact arrangements for mobile and short screens. Reduced-motion preferences disable hover transitions. No JavaScript is required.

The hero uses illustrative robotic-hand artwork generated with the built-in Imagegen tool. The source image, provenance and complete prompt are preserved in `design/ASSET-NOTES.md`. The website serves an optimized JPEG.

## Deployment

Vercel serves the static `dist/` directory directly, without a build command or package installation.

- Public website: https://qiao-nine.vercel.app
- GitHub repository: https://github.com/faustinhavard-source/qiao (private; source branch `main`).
- Vercel project: https://vercel.com/joinef/qiao

The initial production deployment was uploaded from these exact site assets. Automatic deployment from GitHub is not connected yet. To enable it, connect `faustinhavard-source/qiao` in the project's Git settings and use `main` as the production branch: https://vercel.com/joinef/qiao/settings/git .
