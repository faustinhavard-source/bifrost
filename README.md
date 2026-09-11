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

The reference uses **New Mercat**, by Toormix: https://toormix.com/ca/projecte/new-mercat . No New Mercat font file or licence was supplied. The site uses **VT323** by Peter Hull, preserving the pixel terminal style. VT323 is distributed under the SIL Open Font License; the licence is included in `dist/assets/FONT-LICENSE.txt`.

To use the exact reference typeface, supply a properly licensed New Mercat webfont and replace the `Terminal` font-face declaration in `dist/styles.css`, then check the character spacing on the figure.

## Behaviour

The page is a black viewport with one centred humanoid made entirely of the programme's wording, in the original acid yellow (#ddff4b). A small Canvas 2D renderer projects text onto articulated body surfaces. The figure walks in place in a 2.8-second loop, rendered at up to 30 frames per second. There are no external runtime dependencies, navigation, contact buttons or scrolling.

Click or tap to pause and resume; the same control works with Enter or Space. Reduced-motion preferences start with a still pose. Animation stops while the page is hidden. Programme information is also available as semantic text to screen readers. A rendered still in `dist/assets/humanoid.png` displays while the local font loads, or if JavaScript is unavailable.

The renderer exports `drawFrame` under Node for generating the fallback with the same geometry and for checking poses without a browser. Regenerate the still whenever the geometry, typography or copy changes.

The rejected dark visual direction is no longer used on the website. Its source artwork remains archived in `design/`.

## Deployment

Vercel serves the static `dist/` directory directly, without a build command or package installation.

- Public website: https://qiao-nine.vercel.app
- GitHub repository: https://github.com/faustinhavard-source/qiao (private; source branch `main`).
- Vercel project: https://vercel.com/joinef/qiao

The initial production deployment was uploaded from these exact site assets. Automatic deployment from GitHub is not connected yet. To enable it, connect `faustinhavard-source/qiao` in the project's Git settings and use `main` as the production branch: https://vercel.com/joinef/qiao/settings/git .
