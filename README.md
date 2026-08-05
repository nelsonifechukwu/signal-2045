# SIGNAL / 2045 — HELIX–7

An audience-powered, 15-minute Cambridge science showcase for three Grade 9–10 presenters.

The audience joins a fictional mission to diagnose **HELIX–7**, a sealed orbital biofactory carrying yeast engineered with a model therapeutic-protein gene and a fluorescent reporter. After a radiation event, its PCR and light readings disagree. The team must connect:

`genetic engineering → PCR → nanotechnology → AI → orbital physics → responsible decision`

This is not a slide deck with a poll attached. The phones change the live scientific system.

## Start the show

```bash
npm install
npm start
```

Open [http://localhost:4173](http://localhost:4173) on the presentation laptop and press `F` for fullscreen. Audience phones must be on the same Wi-Fi or hotspot as the laptop.

The pre-show screen displays a QR code and a short local-network address. If guest Wi-Fi isolates devices, use a phone hotspot or travel router. Internet access is not required.

If the QR uses the wrong address, restart with:

```bash
PUBLIC_URL=http://YOUR-LAPTOP-IP:4173/audience.html npm start
```

## Public deployment

The app needs a Node.js host because Socket.IO synchronises the presenter and audience in real time. GitHub Pages alone cannot run it or accept audience writes.

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and connect the repository.
3. When prompted for `HOST_TOKEN`, enter a private presenter access code.
4. Open the resulting `https://signal-2045.onrender.com` address. The QR code automatically points phones to the public HTTPS audience page.

The presenter page asks for the access code once per browser tab. Audience members never need it. You can also open `https://YOUR-DOMAIN/?host=YOUR-CODE`; the code is removed from the address bar and retained only for that tab.

Mission state intentionally lives in memory. It resets when the service restarts, which matches the existing show reset behaviour and avoids storing audience activity. A database or text file is not required.

## What the audience actually does

1. Labels a distinct synthetic control measurement.
2. Commits to whether a microscope can read DNA letters.
3. Powers the shared PCR thermocycler.
4. Solves a complementary-primer puzzle.
5. Fires photons to expose a virtual wafer.
6. Chooses the neural-network capacity.
7. Watches real epochs, loss, training accuracy and withheld-test accuracy.
8. Challenges the trained model with an unseen point.
9. Decides whether the AI result is sufficient or needs verification.
10. Sets the spacecraft’s sideways velocity; the room’s median drives a real two-body simulation.
11. Makes the final return, quarantine or remote-analysis decision.

## Presenter controls

- `→` / Page Down: next scene
- `←` / Page Up: previous scene
- `Enter`: perform the scene’s main reveal or simulation
- `N`: show/hide the rehearsal cue overlay
- `F`: fullscreen
- `D`: fill missing interactions with deterministic demonstration data
- `Shift + R`: reset the entire mission and all responses

On-screen buttons remain available for every important interaction. The software never requires the phones to progress.

## Three student roles

- **Student 1 — Molecular Systems Lead:** engineered gene circuit, DNA visibility, PCR and primer specificity.
- **Student 2 — Nano + Intelligence Lead:** nanoscale, photolithography, training data, neural network, uncertainty and verification.
- **Student 3 — Flight Dynamics Lead:** gravity, orbital velocity, collective trajectory and containment decision.

Edit the three names in [public/show-config.js](public/show-config.js).

## Timing

| Time | Lead | Performance beat |
|---|---|---|
| Pre-show | Mission control | QR join and synthetic-control labels |
| 0:00–1:05 | Student 1 / all | Radiation anomaly and three-person mission map |
| 1:05–4:45 | Student 1 | Gene circuit, microscope poll, PCR and primer puzzle |
| 4:45–6:55 | Student 2 | Nanoscale dive, crowd photolithography and chip pipeline |
| 6:55–10:20 | Student 2 | Dataset, architecture vote, live training, model challenge and audit |
| 10:20–12:30 | Student 3 | Orbit explanation and audience-driven trajectory |
| 12:30–13:30 | Student 3 | Containment/return decision |
| 13:30–15:00 | All | Interdisciplinary replay and three closing lines |

The presentation countdown begins when scene 1 opens. Detailed speaking lines and handoffs are in [PRESENTER_GUIDE.md](PRESENTER_GUIDE.md).

## Live-show fallback

Press `D` at any time or click **School Wi-Fi fallback**. This fills only the missing dataset and votes with clearly internal demonstration values; it does not erase real audience data.

Rehearse once with phones and once entirely in fallback mode. The stage-only version remains complete: presenters can use on-screen buttons while the room responds by show of hands.

## Scientific honesty

- HELIX–7 and every measurement are fictional. No organism, DNA, personal information or medical decision is involved.
- The genetic experiment is sealed engineered yeast producing a **model** protein, not a treatment for people.
- PCR copies one selected DNA region. It does not verify the complete genome or prove the protein works.
- `2³⁰ = 1,073,741,824` assumes perfect doubling. Real PCR is less efficient and eventually plateaus.
- Photolithography uses light to pattern photoresist; developing, etching, deposition and many aligned layers produce a finished chip.
- The neural network is real but educational. It uses two synthetic features and a tiny hidden layer.
- Training accuracy measures examples the model has seen. Withheld-test accuracy is a better—but still limited—check of generalisation.
- The displayed output is a **model score**, not proof and not necessarily a calibrated probability.
- Low-orbit spacecraft are still under strong gravity. Weightlessness is shared freefall.
- Rockets need thrust to launch and change orbit; they do not need continuous thrust merely to remain in an ideal orbit.

## Technical structure

- Express serves all assets locally.
- Socket.IO synchronises the stage and phone controllers.
- A real small multilayer perceptron trains in the stage browser with animated backpropagation results.
- Canvas renders the learned decision surface and the Newtonian two-body orbit.
- Persistent anonymous callsigns prevent duplicate samples after reconnection.
- No CDN, account, cloud database or internet API is required.
