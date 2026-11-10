# Mobile controls add-on

This is an additive touch-control layer for the existing game. The original `2.0 html` file is intentionally left untouched.

To use it, add this one script tag immediately before `</body>` in `2.0 html`:

```html
<script src="mobile-controls.js"></script>
```

The add-on provides a touch joystick (forwards WASD key events) and touch buttons for primary fire (left mouse), alternate fire (right mouse), jump, sprint, and interact. Existing desktop controls are unchanged. The overlay appears on coarse-pointer devices while the game body has the `ingame` class.

If you host the HTML and JavaScript from different paths, adjust the script `src` to point to this file. For a standalone downloaded HTML file, use an inline `<script>` tag with the contents of `mobile-controls.js` instead.
