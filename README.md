<!-- README.md: project overview -->
# cl0w.nz

Terminal-style personal hub with themed UI, admin controls, mini-tools, and an interactive Playground lab. The site is fully client-side and stores user settings in `localStorage`.

## Highlights
- Multi-theme terminal UI with optional effects, font switching, and icon toggles.
- Admin panel for content management, feature flags, and menu visibility.
- Modular app sections: Home, About, Work, Notes, Blog, To‑Do, Gallery, Draw, Saver, Games, Playground, Final.
- Offline-friendly layout (no mandatory server dependencies).

## Structure
```
.
├── assets/                # Media assets (audio, PDFs)
├── css/                   # Stylesheets
├── js/                    # Application modules
├── index.html             # Main entry point
├── honk.html              # Fun fallback page
├── README.md              # Project overview
├── LICENSE
└── CNAME
```

## Local usage
Open `index.html` in a browser or serve the repo:
```
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## Admin
- Admin access is unlocked via the themed easter sequence in the UI.
- Once unlocked, the `/admin` view lets you toggle sections, manage content, and apply theme extras.

## Development notes
- JS modules live in `js/` and are loaded in `index.html`.
- Shared state is stored in `js/data.js` and saved to `localStorage`.
- Audio assets (e.g. `assets/xero.wav`) and PDFs live in `assets/`.

## Final showcase
The `/final` menu entry renders the in-app final showcase and includes a gated **View in 3D** action that opens the Playground 3D lab once enabled in admin and after the clown easter egg is triggered.
