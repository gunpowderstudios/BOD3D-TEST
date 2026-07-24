# BOD3D-TEST Changelog

## v11.71

- Restored the desktop vertical health-heart column above the compass.
- Hearts update automatically when the hero gains or loses Health.
- Kept the extra heart column hidden on mobile, where Health remains in the compact status/drawer.
- No gameplay or combat changes.

## v11.70

- Removed the unused Zoom − and Zoom + buttons on desktop and mobile.
- Kept the Centre control and compass unchanged.
- Shifted the mobile top-bar/Map control left to reserve clear space for Mute and Full Screen.
- No gameplay, combat, drawer or audio-behaviour changes.

## v11.69

- Centralised the active patch version and cache-busting value in `assets/reward-fix.js`.
- Added a visible startup warning when an essential patch script or stylesheet fails to load.
- Removed the stale loader reference to the missing `assets/quest-log-colours.js` file.
- Added this changelog.
- No gameplay or combat changes.

## v11.68

- Restored a permanently visible Mute button on desktop and mobile.
- Removed the thick grey border from the right edge of the character panel.

## v11.67

- Fixed the combat cleanup observer so Fight and Run Away remain responsive.

## v11.66

- Removed the initial “Dice will appear here.”, “Ready to fight!” and “A monster blocks your path.” placeholders.
- Removed the unwanted combat/sidebar divider.

## v11.65

- Prevented the Ice Staff and Large Steel Axe from being drawn before 20 dungeon tiles are laid.
- Moved the Ring of Creation to a living non-Dragon monster with 10 or more starting Health after tile 20.
- Made the Ring replace that guardian’s normal item reward.
- Kept a remotely dropped Ring on its tile until the hero reaches it.

## v11.64

- Added Android page/app lifecycle handling for loading-screen and dungeon ambience.
- Made the Mute setting control both ambience tracks and persist across reloads.

## v11.63

- Enlarged the responsive warning parchment writing area.

## v11.62

- Kept the warning heading visible on desktop.

## v11.61

- Rebuilt the warning parchment layout responsively.

## v11.60

- Limited selectable heroes to Sirrus and Tamara.
