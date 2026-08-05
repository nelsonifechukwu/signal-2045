# SIGNAL / 2045 — HELIX–7

An audience-powered, 15-minute Cambridge science showcase for three Grade 9–10 presenters.

The audience joins a fictional mission to diagnose **HELIX–7**, a sealed orbiting lab containing engineered yeast. Its DNA test and green reporter glow disagree after a radiation event, so the class must connect:

`genetic engineering → PCR → nanotechnology → AI → orbital physics → responsible decision`

The phones are part of the demonstration: they submit training samples, control shared animations, test the AI and choose the spacecraft’s path.

## Start it on this computer

Open Terminal in the project folder.

The first time:

```bash
npm install
npm start
```

After that, normally only this is needed:

```bash
npm start
```

Open [http://localhost:4173](http://localhost:4173) on the presentation laptop. Keep Terminal open while the show is running. Press `Control + C` in Terminal to stop it.

Press `F` for full screen. The countdown begins when the presenter moves from the QR lobby to Scene 1.

## Connect audience phones

1. Put the laptop and phones on the same Wi-Fi network or phone hotspot.
2. Leave the QR lobby open on the projector.
3. Scan the QR code on each phone.
4. Check that **LIVE** appears at the top of the phone.
5. Label the opening practice sample using the rule shown on the phone.
6. Tap **Send this label**.
7. Check that the stage’s phone and sample counts rise.

Keep the phone page open. Each activity appears automatically when the presenter changes scenes.

Some school and guest networks block devices from talking to one another. If that happens, use a phone hotspot or travel router. Local mode does not require internet access.

If the QR code uses the wrong address, stop the server and restart it with the laptop’s reachable address:

```bash
PUBLIC_URL=http://YOUR-LAPTOP-IP:4173/audience.html npm start
```

## Fallback and reset

If too few phones connect, click **Load demo audience** or press `D`. Wait for **Demo audience loaded**. The fallback adds a deterministic practice sample set and fills polls or speed choices that are still empty; it does not remove real responses.

To clear a rehearsal, press `Shift + R` and confirm the warning. This resets the scene, samples, votes, taps, AI model and flight choices. Connected phones remain open and begin a fresh run.

Rehearse once with two real phones and once using only the demo fallback.

## Presenter controls

- `→` / Page Down: next scene
- `←` / Page Up: previous scene
- `N`: show or hide the private rehearsal cue
- `F`: full screen
- `D`: load demo responses for missing interactions
- `Shift + R`: reset the complete mission after confirmation
- `Enter`: run the current scene’s main action

Every important action also has a labelled on-screen button. During rehearsal, clicking that button is clearer than using `Enter`.

The exact 15-minute speaking, clicking and feedback sequence is in [PRESENTER_GUIDE.md](PRESENTER_GUIDE.md).

## What each interaction teaches

| Scene | What the audience does | The one idea it teaches |
|---|---|---|
| Lobby | Labels one known practice sample | Supervised AI needs examples paired with checked answers. |
| 4 | Votes on whether a microscope can read DNA letters | Seeing DNA material is different from reading its sequence. |
| 5 | Adds taps to the shared PCR model | Repeated PCR cycles can copy one chosen DNA section exponentially. |
| 6 | Matches the strand paired with `CTGTG` | Complementary DNA bases pair A–T and C–G. |
| 8 | Answers a nanometre scale question | A nanometre is one billionth of a metre. |
| 9 | Adds symbolic UV light to the wafer | Photolithography uses patterned light before later chemical steps form chip structures. |
| 11 | Chooses 2, 4 or 8 hidden units | A more flexible model can learn a harder pattern but can also fit noise. |
| 12 | Watches the model train | Epoch, loss and accuracy describe different parts of learning and testing. |
| 13 | Builds new samples and asks the AI | A model applies its learned boundary to data it has not seen before. |
| 13 | Watches four checked samples trigger retraining | Better independent evidence can move a model’s decision boundary. |
| 14 | Decides whether an AI score is enough | A confident prediction is still not proof. |
| 15 | Answers a gravity question | Astronauts float in orbit because everything is falling together, not because gravity disappears. |
| 15 | Watches too-slow, orbit and escape paths | Sideways speed changes the shape and fate of a spacecraft’s path. |
| 16 | Sends a sideways speed for the class spacecraft | One short speed change can produce re-entry, an ellipse, a circle or escape. |
| 17 | Chooses Earth, orbit or remote testing | Scientific evidence informs a decision, but people must weigh the trade-offs. |

## Three student roles

- **Student 1 — Genetics Lead:** engineered gene circuit, DNA visibility, PCR and complementary pairing.
- **Student 2 — Chip + AI Lead:** nanoscale, photolithography, sensing, neural-network training and verification.
- **Student 3 — Spaceflight Lead:** gravity, sideways speed, orbit correction and the final risk decision.

Edit the three names and roles in [public/show-config.js](public/show-config.js).

## Timing

| Time | Lead | Scenes |
|---|---|---|
| Pre-show | Mission control | QR join and opening sample labels |
| 0:00–1:05 | Student 1 / all | Alert and three-person plan |
| 1:05–4:45 | Student 1 | Gene circuit, microscope vote, PCR and pairing puzzle |
| 4:45–6:55 | Student 2 | Nanoscale, photolithography and light sensing |
| 6:55–10:20 | Student 2 | Labelled data, training, model challenge and verification |
| 10:20–12:30 | Student 3 | Orbit concept and audience-driven correction |
| 12:30–13:30 | Student 3 | Final risk decision |
| 13:30–15:00 | All | Recap and closing lines |

## Public deployment

The app needs a Node.js host because Socket.IO synchronises the stage and phones in real time. GitHub Pages alone cannot run it or accept audience responses.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/nelsonifechukwu/signal-2045)

1. Click **Deploy to Render** and sign in.
2. Enter a private presenter code when Render asks for `HOST_TOKEN`.
3. Create the Blueprint and wait for deployment to finish.
4. Open the resulting HTTPS address. Its QR code points phones to the public audience page.

The presenter page asks for the code once per browser tab. Audience members never need it. A presenter can also open `https://YOUR-DOMAIN/?host=YOUR-CODE`; the code is removed from the address bar and kept only for that tab.

Mission state lives in memory and resets when the service restarts. The app does not need a database.

## Scientific limits stated in the show

- HELIX–7 and all measurements are fictional. The app collects no organism, DNA, medical or personal data.
- The engineered yeast makes a fictional test protein, not a treatment for people.
- The first phone task uses a teaching answer key. Real labels would need independent tests.
- PCR copies one selected region; it does not check the whole genome or prove that a protein works.
- The five-letter pairing puzzle is not a real primer design. Real PCR uses two longer primers.
- `2³⁰ = 1,073,741,824` assumes ideal doubling. Real PCR is less efficient and eventually plateaus.
- Photolithography patterns a light-sensitive coating; developing, etching, deposition and many aligned layers make a finished chip.
- The neural network is real but small and educational. Its model score is not proof or automatically a calibrated probability.
- Training accuracy uses seen examples. Separate test accuracy is a better, but still limited, check of generalisation.
- At 400 km, gravity is still about 90% as strong as at Earth’s surface. Orbital weightlessness is shared free fall.
- In the simplified orbit model, below about `0.99×` circular speed enters the atmosphere, `1.00×` is circular, and `1.42×` or more escapes.
- Rockets need thrust to launch and change orbit, but not to remain in an ideal orbit continuously.

## Check before presentation day

```bash
npm run check
npm test
```

These commands check JavaScript syntax and server interactions. On macOS with Google Chrome installed in `/Applications`, the optional full browser rehearsal is:

```bash
npm run test:show
```

## Technical structure

- Express serves the presentation and phone interface.
- Socket.IO keeps stage and audience state in sync.
- A small multilayer perceptron trains live in the stage browser.
- Canvas draws the AI decision surface and the simplified Newtonian orbit.
- Persistent anonymous browser IDs prevent duplicate submissions after reconnection; friendly `HELIX-######` callsigns are display-only.
- No CDN, account, cloud database or internet API is required for local use.
