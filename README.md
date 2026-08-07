# SIGNAL / 2045 — HELIX–7

An interactive 15-minute Cambridge science presentation for three Grade 9–10 students.

The audience helps investigate **HELIX–7**, a fictional orbiting laboratory containing engineered yeast. After a simulated radiation event, PCR still detects one section of an added control gene, but the green light from GFP is low.

The presentation covers genetic engineering, PCR, nanotechnology, AI, orbital physics and scientific decision-making. Audience members use their phones to submit training samples, control demonstrations, test the AI model and choose an orbital speed.

## Start the presentation locally

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

Open [http://localhost:4173](http://localhost:4173) on the presentation laptop. Keep Terminal open during the presentation. Press `Control + C` in Terminal to stop the server.

Press `F` for full screen. The countdown begins when the presenter moves from the QR screen to Scene 1.

## Connect audience phones

1. Put the laptop and phones on the same Wi-Fi network or phone hotspot.
2. Leave the QR lobby open on the projector.
3. Scan the QR code on each phone.
4. Check that **CONNECTED** appears at the top of the phone, above a short welcome message.
5. Check that the stage’s phone count rises.
6. Move to Scene 1. The sample task now appears on every phone.
7. Tap a point on the phone’s graph to choose a sample, label it using the rule shown on the phone and tap **Send this label**.
8. Check that the stage’s sample count rises.

The phones stay on the welcome message for the whole lobby, so nobody is asked to label a sample before Scene 1 has explained the problem. Keep the phone page open. Each activity appears automatically when the presenter changes scenes.

Some school and guest networks prevent devices on the same network from connecting directly. If that happens, use a phone hotspot or travel router. Local mode does not require internet access.

If the QR code uses the wrong address, stop the server and restart it with an IP address that the phones can reach:

```bash
PUBLIC_URL=http://YOUR-LAPTOP-IP:4173/audience.html npm start
```

## Demo fallback and reset

If too few phones connect, select **Load demo audience** or press `D`. Wait for **Demo audience loaded**. This adds a fixed set of practice samples and fills any polls or speed choices that are still empty. It does not remove real responses.

To clear a rehearsal, press `Shift + R` and confirm the warning. This resets the presentation, samples, votes, taps, AI model and speed choices. Connected phones remain open and start a new session.

**Reloading the stage page does the same thing.** Every load of the stage starts a new run: the deck returns to the QR lobby, all audience responses are deleted, and every phone re-arms its activities. That keeps a reload from leaving phones stuck on activities they completed in an earlier rehearsal — but it also means an accidental reload during a live show loses the responses so far. To reload without wiping the run, open the stage as `/?keep` and reload from that address.

A phone reload never hides an activity: each phone asks the server what it has already sent, so it can only skip work the server actually holds.

Rehearse once with two real phones and once using only the demo fallback.

## Presenter controls

- `→` / Page Down: next scene
- `←` / Page Up: previous scene
- `N`: show or hide presenter notes
- `F`: full screen
- `D`: load demo responses for missing interactions
- `Shift + R`: reset the presentation after confirmation
- `Enter`: run the current scene’s main action

Every important action also has a labelled on-screen button. During rehearsal, use the button if you want to see which action will run.

On a tablet or any touchscreen, the same navigation is available by hand:

- Tap the slide anywhere: next scene
- Tap the left edge (the first fifth of the slide): previous scene
- Swipe left or right: next or previous scene

Taps on a presenter button run that button rather than changing scene, and a mouse click never changes scene, so clicking the window to focus it is safe.

The exact 15-minute speaking, clicking and feedback sequence is in [PRESENTER_GUIDE.md](PRESENTER_GUIDE.md).

## Scene overview

| Scene | Audience activity | Main point |
|---|---|---|
| Lobby | Welcome message only | Phones connect while people are still arriving. |
| 1–3, and 10 for latecomers | Chooses one sample on the graph and labels it | Supervised AI needs examples with known labels. |
| 4 | Votes on whether a microscope can read a DNA sequence | Seeing DNA material is different from identifying its sequence. |
| 5 | Adds taps to the PCR demonstration | Repeated PCR cycles can rapidly copy one short section of the control gene. |
| 6 | Matches the strand paired with `CTGTG` | Complementary DNA bases pair A–T and C–G. |
| 8 | Answers a nanometre scale question | A nanometre is one billionth of a metre. |
| 9 | Adds simulated UV exposure | Photolithography uses patterned light before chemical and material processes form chip structures. |
| 11 | Votes for 2, 4 or 8 hidden neurons | The counter starts from the leading vote; the presenter can choose 1–8. The model uses control-gene PCR and GFP-light scores to predict WORKING or CHANGED. |
| 12 | Watches the model train | The model compares its predictions with known labels and adjusts its weights. Epoch, loss and accuracy describe training and testing. |
| 13 | Chooses a new sample on the graph and tests the model | A trained model classifies data it has not seen before. |
| 13 | Adds four independently verified samples and retrains | New evidence can change how the model classifies data. |
| 14 | Decides whether an AI score is enough | A high model score is not proof. |
| 15 | Answers a gravity question | Astronauts appear weightless because the crew and spacecraft are falling together. |
| 15 | Compares re-entry, orbit and escape speeds | Sideways speed determines whether the spacecraft re-enters, remains in orbit or escapes. |
| 16 | Submits a sideways speed | A short change in speed can produce re-entry, an elliptical orbit, a circular orbit or escape. |
| 17 | Chooses Earth, orbit or remote testing | Evidence describes risks and benefits, but people must decide which trade-offs are acceptable. |

## Three student roles

- **Student 1 — Genetics Lead:** engineered gene circuit, limits of microscopy, PCR and complementary base pairing.
- **Student 2 — Chip and AI Lead:** nanoscale, photolithography, sensing, neural-network training and verification.
- **Student 3 — Spaceflight Lead:** gravity, sideways speed, orbit correction and the final risk decision.

Edit the three names and roles in [public/show-config.js](public/show-config.js).

## Timing

| Time | Lead | Scenes |
|---|---|---|
| Before start | Presenter | QR code and opening sample labels |
| 0:00–1:05 | Student 1 / all | Problem and three-person plan |
| 1:05–4:45 | Student 1 | Gene circuit, microscope vote, PCR and base pairing |
| 4:45–6:55 | Student 2 | Nanoscale, photolithography and light sensing |
| 6:55–10:20 | Student 2 | Labelled data, training, model challenge and verification |
| 10:20–12:30 | Student 3 | Orbit concept and audience-driven correction |
| 12:30–13:30 | Student 3 | Final risk decision |
| 13:30–15:00 | All | Recap and closing lines |

## Public deployment

Public deployment requires a server that can run Node.js and handle live Socket.IO connections. A static host such as GitHub Pages cannot receive or synchronise audience responses.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/nelsonifechukwu/signal-2045)

1. Click **Deploy to Render** and sign in.
2. Enter a private presenter code when Render asks for `HOST_TOKEN`.
3. Create the Blueprint and wait for deployment to finish.
4. Open the resulting HTTPS address. Its QR code points phones to the public audience page.

The presenter page asks for the code once in each browser tab. Audience members do not need it. A presenter can also open `https://YOUR-DOMAIN/?host=YOUR-CODE`; the app removes the code from the address bar and stores it only for that tab.

The server stores the current session in memory, so the session resets whenever the service restarts. The app does not need a database.

## Scientific limits stated in the show

- HELIX–7 and all measurements are fictional. The app collects no organism, DNA, medical or personal data.
- The fictional control gene makes a regulatory protein that switches on a GFP reporter gene. GFP is a real reporter protein, not a treatment.
- The first phone task uses a simple teaching rule. Real labels would need independent tests.
- PCR copies one short section of the control gene. It does not show whether the complete control gene works or whether the GFP reporter gene makes GFP.
- The five-letter pairing puzzle is not a real primer design. Real PCR uses two longer primers.
- `2³⁰ = 1,073,741,824` assumes ideal doubling. Real PCR is less efficient and eventually plateaus.
- Photolithography exposes a light-sensitive coating in a pattern. Developing, etching, deposition and many aligned layers are also needed to make a finished chip.
- The neural network is real but small and educational. Its model score is not proof or automatically a calibrated probability.
- Training accuracy uses examples included in training. Test accuracy uses separate examples and gives a better, but still limited, check of performance on new data.
- At 400 km, gravity is still about 90% as strong as at Earth’s surface. Astronauts appear weightless because the crew and spacecraft are falling together.
- In the simplified orbit model, a speed below about `0.99×` circular-orbit speed causes atmospheric re-entry, `1.00×` produces a circular orbit, and `1.42×` or more produces escape.
- Rockets need thrust to launch and change orbit, but not to remain in an ideal orbit continuously.

## Run the checks

```bash
npm run check
npm test
```

These commands check JavaScript syntax and server interactions. On macOS, with Google Chrome installed in `/Applications`, you can also run the full browser test:

```bash
npm run test:show
```

## Technical structure

- Express serves the presentation and phone interface.
- Socket.IO keeps stage and audience state in sync.
- A small neural network trains live in the stage browser.
- Canvas draws the AI classification map and the simplified Newtonian orbit.
- Anonymous browser IDs prevent duplicate submissions after reconnection. The visible `HELIX-######` codes are only participant labels.
- Stage text sizes come from four `--label-*` steps in `public/styles.css`, each a `clamp()` that grows with the projector: on a 1920-wide projection the smallest lands near 14px, which is the floor for reading from the back of a room. Use those variables for any new stage label instead of a fixed pixel size. Laptop-only chrome (footer rail, presenter badge, notes, shortcut hints) and the phone interface keep their own smaller sizes, because both are read from arm's length.
- Local use does not require a CDN, account, cloud database or internet API.
