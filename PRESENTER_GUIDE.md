# SIGNAL / 2045 — Presenter Guide

This guide contains the script and controls for a 15-minute presentation. One student speaks at a time while an operator controls the laptop. Speakers should face the audience rather than the computer.

Use the same rhythm every time:

**Ask a question → wait for responses → show the result → explain the main point.**

The quoted lines are suggested wording. Presenters do not need to memorise them word for word.

## Start it locally

Open Terminal in the project folder and run:

```bash
npm install
npm start
```

`npm install` is only needed the first time, or after the dependencies change.

Open [http://localhost:4173](http://localhost:4173) on the presentation laptop. Keep Terminal open during the presentation. Press `Control + C` to stop the server.

## Connect the phones

1. Put the laptop and phones on the same Wi-Fi network or phone hotspot.
2. Open the stage and press `F` for full screen.
3. Leave Scene 0 and its QR code on screen.
4. Ask everyone to scan the QR code. The top of each phone should say **CONNECTED**.
5. Each phone receives one practice sample with a DNA-match score and a green-light score.
6. On the phone, choose **CIRCUIT WORKING** only when both scores are 60 or higher. If either score is below 60, choose **CIRCUIT CHANGED**.
7. Tap **Send this label**. The phone should say **Label sent**, and the stage’s sample count should rise.

Say while people join:

> “Your phone has a fictional practice sample for the AI. Choose CIRCUIT WORKING only if both scores are 60 or higher. Otherwise choose CIRCUIT CHANGED.”

This rule is only for the first activity. Scene 13 explains why real labels need independent tests.

## Fallback and reset

If the network is unreliable or too few people join, select **Load demo audience** or press `D`. Wait until the button says **Demo audience loaded** and the sample count rises. This adds a fixed set of practice samples and fills any polls or speed choices that are still empty. It does not erase real responses.

To clear a rehearsal, press `Shift + R`, read the warning and confirm. This returns the stage to Scene 0 and clears samples, votes, taps, the AI model and speed choices. Connected phones stay open and start a new session.

## Presenter controls

- `→` or Page Down: next scene
- `←` or Page Up: previous scene
- `N`: show or hide presenter notes
- `F`: full screen
- `D`: load demo responses for missing interactions
- `Shift + R`: reset everything after confirmation
- `Enter`: run the scene’s main action

During rehearsal, use the named on-screen button if you want to see which action will run.

At the end of every numbered scene below, the laptop operator presses `→` once.

## Student 1 — Genetics

While the audience connects, keep the explanation focused on the phone task:

> “The DNA-match and green-light scores on your phone are simulated. Use the rule on the screen to label the sample WORKING or CHANGED.”

### Scene 1 — The problem, 0:00–0:30

**Operator:** Press `→` from the QR screen. The 15-minute clock starts now.

> “HELIX–7 is a small laboratory containing engineered yeast. It is orbiting 400 kilometres above Earth.”

> “Its DNA test detects the added gene, but the green reporter is no longer glowing. We have fifteen minutes to investigate and decide what to do with the laboratory.”

### Scene 2 — The plan, 0:30–1:05

**Operator:** No click on this scene.

Each presenter steps forward when introduced.

> “First, we will check whether the target DNA is present. Then we will measure the green light and train a model to combine both results. Finally, we will test the possible orbits. Our final decision needs both the biological evidence and the orbital options.”

### Scene 3 — The engineered yeast, 1:05–1:50

**Operator:** No click on this scene. Student 1 points from **START** to **STOP**.

> “We added two genes to the yeast. One produces a fictional test protein. The reporter gene produces green light when the engineered DNA is active.”

> “After simulated radiation exposure, the DNA test detected the target, but the green light disappeared. The cause could be a DNA change, a problem in the cell or a faulty detector.”

The protein is fictional. Do not call it a medicine.

### Scene 4 — Microscope vote, 1:50–2:30

**Audience:** Vote **YES** or **NO** on the phone.

**Operator:** Wait until the two stage bars move, then click **Show the answer**. Check that the button changes to **Answer shown** and the answer appears on both screens.

> “A microscope can show DNA material or structures, but it normally cannot identify the order of A, T, C and G.”

> “Sequencing identifies that order. PCR tests whether a selected section of DNA is present.”

### Scene 5 — PCR, 2:30–3:30

**Operator, in order:**

1. Select **95°C — SEPARATE / DENATURE** and read the explanation below the tiles.
2. Select **55°C — PRIMERS BIND / ANNEAL**.
3. Select **72°C — BUILD / EXTEND**.
4. Select **Run 1 full cycle**. Wait for the button to say **Running one cycle…**, then for the cycle counter to rise.
5. Ask the audience to tap **ADD ONE TAP** on their phones. The demonstration advances one cycle for every four audience taps.
6. Click **Jump to cycle 30**. Wait until both PCR buttons say **Cycle 30 reached** and phones show **1.07 BILLION**.

Say before the phone taps:

> “Phone taps only control the animation. In real PCR, heat separates the DNA strands, primers bind to the target sequence, and an enzyme copies it.”

> “With perfect doubling, 30 cycles would produce just over 1.07 billion copies. Real PCR is less efficient and eventually reaches a plateau.”

### Scene 6 — DNA base pairing, 3:30–4:20

**Audience:** Choose the strand that pairs with `CTGTG`.

**Operator:** Wait for the percentages, then click **Show the match**. Check that the button changes to **Match shown**, `GACAC` fills the lower strand, and the correct option is highlighted.

> “A pairs with T, and C pairs with G. The complementary strand for CTGTG is GACAC.”

> “This five-letter task only demonstrates base pairing. Real PCR needs two longer primers and further design checks.”

### Scene 7 — Next step, 4:20–4:45

**Operator:** No click on this scene.

Student 1:

> “PCR confirms that the selected DNA section is present, but it cannot show whether the reporter gene is active.”

Pass the optional sample tube to Student 2.

Student 2:

> “I will use a chip-based sensor to measure the green light, then compare that score with the PCR result using an AI model.”

## Student 2 — Nanotechnology and AI

### Scene 8 — Nanoscale, 4:45–5:25

**Audience:** Answer the fingernail-growth question on the phone.

**Operator:** Drag the stage slider slowly from `10⁰ m` to `10⁻⁹ m`. Pause briefly on the named objects and finish at **ONE NANOMETRE / 1 nanometre**.

> “The sensor contains structures measured in nanometres. One nanometre is one billionth of a metre—about how far a fingernail grows each second.”

### Scene 9 — Make a chip pattern with light, 5:25–6:20

**Audience:** Tap **ADD UV LIGHT**. The phone shows each person’s taps and the class total out of 48.

**Operator:** Let several light pulses appear. When the audience meter is full—or when it is time to continue—select **Show the next manufacturing steps**. Wait for **Manufacturing steps shown** and for **MASK, EXPOSE, ETCH, REPEAT** to light up. Phones should show **CHIP PATTERN COMPLETE**.

> “The mask blocks UV light except in the selected pattern. The exposed parts of the light-sensitive coating change.”

> “Phone taps only control the animation. Manufacturing also requires development, etching, material deposition and many precisely aligned layers.”

### Scene 10 — Measure the light, 6:20–6:55

**Operator:** No click. Student 2 points through the four boxes from left to right.

> “UV light was used to make the chip. Now the finished sensor measures the yeast’s green reporter light.”

> “The sensor—not the AI—measures the light and records a green-light score. For each sample, the AI receives that score and the DNA-match score from PCR.”

### Scene 11 — Choose the model size, 6:55–7:40

**Audience:** Vote for **2**, **4** or **8** hidden units on the phone.

**Operator:** The stage starts with the audience’s leading choice. Keep **FOLLOW VOTE**, or select **USE 2**, **USE 4** or **USE 8** before training. The setting locks once training starts. Do not start training until Scene 12.

> “Each dot is one training sample. The horizontal axis is the DNA-match score from PCR: farther right means a stronger match. The vertical axis is the green-light score from the sensor: higher means more light. The graph only plots measurements already taken; it does not measure the light.”

> “The dot’s colour is its known label: WORKING or CHANGED. We train the model to predict that label from the two scores.”

> “Hidden units control how complex a pattern the model can learn. More units can learn a more complicated boundary, but may also learn accidental details from a small dataset.”

If there are fewer than six training samples, press `D`. The next scene will also load training samples automatically if needed.

### Scene 12 — Train the AI, 7:40–8:45

**Operator:** Select **Start training**. Watch the progress reach 500 training rounds. Wait until the phone says **Training complete** and the stage button changes to **Train again**.

Do not select **Reset model** during the presentation. That button clears only the AI model so it can be trained again during rehearsal; it does not reset the whole presentation.

> “For each sample, the model predicts WORKING or CHANGED, compares that prediction with the known label and adjusts its weights to reduce the error.”

> “One epoch is one pass through all the training samples. Loss summarises the prediction error, so lower is better.”

> “Training accuracy uses samples that trained the model. Test accuracy uses separate samples that did not affect training, so it is a better check on new data.”

> “The background colours show what the model would predict for each pair of scores. The border between the colours is the classification boundary.”

### Scene 13 — Test and retrain the AI, 8:45–9:35

**Audience:** Move both sliders and tap **Get a prediction**. To test another sample, move a slider and tap **Test the updated sample**.

**Operator, in order:**

1. Wait until the stage’s **audience tests** count rises.
2. Read the current HELIX–7 model score aloud.
3. Select **Add 4 verified samples and retrain**.
4. Wait while the button says **Retraining with 4 verified samples…**.
5. Continue only when it says **4 verified samples added** and the status sentence reports how the same sample’s score changed.

> “The yellow rings mark four samples checked by an independent test. Their DNA-match and green-light scores look normal, but the independent test shows that their circuits changed.”

> “After we add those samples and retrain, the classification boundary moves and the same HELIX–7 sample receives a different score.”

> “A model score is not proof, and 80 out of 100 does not automatically mean 80 percent certainty.”

### Scene 14 — Is the AI enough?, 9:35–10:20

**Audience:** Choose **ACT ON IT** or **MORE TESTS** on the phone.

**Operator:** Wait for the stage bars, then select **Show the verification steps**. Check that the button says **Checks shown** and the verification box appears.

> “The model gives HELIX–7 a high score. Is that enough to make a decision?”

> “No. We would repeat the measurement, sequence the DNA, check for contamination and use a different detector.”

Handoff to Student 3:

Student 2:

> “The AI result adds evidence, but it does not settle the decision. We still need independent biological tests.”

Student 3:

> “The decision also depends on where the laboratory can travel. I will use orbital physics to test the possible paths.”

## Student 3 — Astrophysics and Spaceflight

### Scene 15 — How an orbit works, 10:20–11:10

**Audience:** Answer the gravity question on the phone.

**Operator:** Select **TOO SLOW**, then **CIRCULAR ORBIT**, then **ESCAPE**. After each selection, pause for the path and result sentence to change. Select **CIRCULAR ORBIT** again so the scene finishes on that path.

> “The biological tests tell us about the sample. Orbital physics tells us which paths the laboratory can take. We need both for the final decision.”

> “At 400 kilometres, gravity is still about 90 percent as strong as it is at Earth’s surface.”

> “Gravity accelerates the spacecraft towards Earth. At orbital speed, its forward motion carries it around Earth as gravity pulls it inward.”

> “Astronauts appear weightless because the crew and spacecraft are in free fall together.”

### Scene 16 — Correct the orbit, 11:10–12:30

**Audience:** Move the speed slider, then tap **Send this speed**. A changed value is not counted until the phone says **Speed sent**.

**Operator, in order:**

1. Wait for at least one speed choice and point out the median audience choice.
2. Select **Simulate this speed**.
3. Wait through **Simulating orbit…** until the full path and result sentence appear.
4. If the audience changes its speeds, wait for **THE SPEED CHANGED — SIMULATE IT AGAIN**, then select **Simulate again**.

> “HELIX–7 begins 400 kilometres above Earth. A short engine firing changes its sideways speed and therefore its orbit.”

> “We use the median—the middle value after sorting the speeds—so one extreme response cannot control the result.”

- Below `0.99×` circular-orbit speed: the spacecraft enters the atmosphere.
- At `1.00×`: circular orbit.
- Between the re-entry and escape limits: elliptical orbit.
- At `1.42×` or above: escape.

> “After the engine firing, the engine can stop. In this simplified model, the spacecraft remains in orbit without continuous thrust.”

### Scene 17 — Final risk decision, 12:30–13:30

**Audience:** Vote **EARTH**, **ORBIT** or **REMOTE** on the phone.

**Operator:** Wait for the three percentages. Read the leading choice, then ask one person to explain it. If time allows, ask someone to defend the second choice.

> “Returning the sample would provide better equipment for testing, but it could expose Earth to an uncertain biological risk. Leaving it in orbit or testing it remotely would reduce that exposure but limit the available tests.”

> “Evidence helps us estimate risks and benefits. People must decide which trade-offs are acceptable.”

## Finale — All three, 13:30–15:00

**Operator:** Press `→` to open the final scene. No more actions are needed. Pause while each student points to their subject.

Student 1:

> “We used genetics to create the system and check one section of its DNA.”

Student 2:

> “Nanotechnology allowed the sensor to measure light. The AI compared the light and DNA data using labelled training examples.”

Student 3:

> “Astrophysics showed how each speed changed the laboratory’s orbit. People still had to make the final decision.”

One student:

> “Your phone responses supplied labels, controlled the demonstrations, tested the AI and selected an orbital speed.”

All three:

> “We needed genetics, nanotechnology, AI and astrophysics to investigate the full problem. Thank you.”

## Questions the audience may ask

**Is the AI real?** Yes. A small neural network trains in the stage browser using the simulated samples. It uses backpropagation to adjust numerical weights inside the network. The scenario and all measurements are fictional.

**What exactly is the model trained to do?** It takes two inputs—the DNA-match score from PCR and the green-light score from the sensor—and predicts one label: WORKING or CHANGED.

**Do the graph axes measure the green light?** No. The horizontal axis plots the DNA-match score, and the vertical axis plots the green-light score. The sensor measured the light before the value was plotted. Dot colours show known training labels; the background colours show the model’s predictions.

**How did you know the first labels?** The opening samples use the stated 60/100 teaching rule. Real labels should come from trusted independent measurements, not from an AI labelling its own training data.

**Why does the model change after the four verified samples?** They contain a combination of measurements that was missing from the first dataset. Retraining changes the classification boundary so the network can account for the new evidence.

**Is 100 percent accuracy always good?** No. A model can memorise its training data, and a small or easy test set may also give a misleading score of 100 percent. Reliable evaluation requires a larger, representative set of samples that the model did not see during training.

**Is the model score a probability?** Not automatically. It is the model’s output for one label, not a calibrated probability. Treating it as a probability would require calibration and independent testing.

**Can a microscope read DNA?** It can show DNA material or structures, but routine microscopy does not give a readable A, T, C and G sequence. Scientists use sequencing to read the letters.

**Does PCR read the whole gene?** No. PCR copies a chosen section between two primers. Sequencing and other tests are needed to check the complete sequence and its function.

**Why is the primer puzzle so short?** It only demonstrates complementary base pairing. Real PCR uses two longer primers and requires extra checks.

**Did the phone taps run PCR or supply the UV light?** No. They only control the animations. Real PCR uses a thermocycler, and real photolithography uses a controlled UV exposure.

**Was the reporter glow the same light used to make the chip?** No. UV light patterns the chip during fabrication. The green reporter light later comes from the engineered yeast and is measured by a sensor.

**Is there gravity in space?** Yes. At 400 kilometres, gravity is about 90 percent as strong as at Earth’s surface. Astronauts float because they and their spacecraft fall together.

**Why can a small slowdown cause re-entry?** Slowing below the model’s `0.99×` limit makes the opposite side of the orbit dip into the atmosphere, where drag removes more energy.

**Does PCR prove the engineered yeast is safe?** No. It checks only one chosen DNA target. Scientists would still need sequencing, protein measurements, tests of cell behaviour and a full safety review.
