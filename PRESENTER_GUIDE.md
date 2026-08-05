# SIGNAL / 2045 — Presenter Guide

This is the rehearsal script for a 15-minute show. One student speaks while one laptop operator clicks. The speaker should face the room, not the computer.

Use the same rhythm every time:

**Ask → wait for the phones → show the result → explain one idea.**

The quoted lines are short enough to say naturally. They do not need to be memorised word for word.

## Start it locally

Open Terminal in the project folder and run:

```bash
npm install
npm start
```

`npm install` is only needed the first time, or after the dependencies change.

Open [http://localhost:4173](http://localhost:4173) on the presentation laptop. Keep Terminal open for the whole show. Press `Control + C` in Terminal when you want to stop the server.

## Connect the phones

1. Put the laptop and phones on the same Wi-Fi network or phone hotspot.
2. Open the stage and press `F` for full screen.
3. Leave Scene 0 and its QR code on screen.
4. Ask everyone to scan the QR code. The top of each phone should say **LIVE**.
5. Each phone receives one practice sample with a DNA-match score and a green-glow score.
6. On the phone, choose **CIRCUIT WORKING** only when both scores are 60 or higher. If either score is below 60, choose **CIRCUIT CHANGED**.
7. Tap **Send this label**. The phone should say **Label sent**, and the stage’s sample count should rise.

Say while people join:

> “These are made-up practice samples. For this first batch, both readings at 60 or above means working. If either one is low, choose changed.”

The simple answer key is only for the starter activity. Scene 13 later shows why real labels need independent checks.

**What the opening interaction teaches:** Supervised AI needs examples paired with labels whose answers are already known.

## Fallback and reset

If the network is unreliable or too few people join, click **Load demo audience** or press `D`. Wait until the button says **Demo audience loaded** and the sample count rises. The fallback adds a practice sample set and fills polls or speed choices that are still empty; it does not erase real responses.

To clear a rehearsal, press `Shift + R`, read the warning, and confirm. This returns the stage to Scene 0 and clears samples, votes, taps, the AI model and speed choices. Connected phones stay open and receive a fresh run.

## Presenter controls

- `→` or Page Down: next scene
- `←` or Page Up: previous scene
- `N`: show or hide the private rehearsal cue
- `F`: full screen
- `D`: load demo responses for missing interactions
- `Shift + R`: reset everything after confirmation
- `Enter`: run the scene’s main action

For rehearsal, click the named on-screen button instead of using `Enter`. This makes it obvious which action is about to run.

At the end of every numbered scene below, the laptop operator presses `→` once.

## Student 1 — Genetics

### Scene 1 — The alert, 0:00–0:30

**Operator:** Press `→` from the lobby. The 15-minute clock starts now. Do not click anything else.

> “HELIX–7 is a small yeast lab orbiting 400 kilometres above Earth.”

> “The DNA test still finds our added gene, but its green status light has gone out. We have fifteen minutes to find out why and choose what happens next.”

**What this scene teaches:** One experiment can produce clues that disagree, so scientists must test more than one explanation.

### Scene 2 — The plan, 0:30–1:05

**Operator:** No click on this scene.

Each presenter steps forward when introduced.

> “I will check the DNA. Student Two will measure the glow and train the AI. Student Three will correct the orbit. You will help us at every step.”

**What this scene teaches:** Genetics, nanotechnology, AI and physics each answer a different part of the same problem.

### Scene 3 — The engineered yeast, 1:05–1:50

**Operator:** No click on this scene. Student 1 points from **START** to **STOP**.

> “We added two linked genes to the yeast. One makes a test protein. The other makes a green glow that acts like a status light.”

> “After a burst of radiation, the DNA was still detected but the glow went dark. The DNA, the cell or the detector may be at fault.”

The protein is fictional. Do not call it a medicine.

**What this scene teaches:** A reporter gene makes a biological process easier to observe, but a missing signal can have several causes.

### Scene 4 — Microscope vote, 1:50–2:30

**Audience:** Vote **YES** or **NO** on the phone.

**Operator:** Wait until the two stage bars move, then click **Show the answer**. Check that the button changes to **Answer shown** and the answer appears on both screens.

> “A microscope can show DNA material, but it does not routinely give us a readable line of A, T, C and G.”

> “Sequencing reads the letters. PCR asks a narrower question: is one chosen DNA section present?”

**What this interaction teaches:** Seeing DNA is not the same as reading its sequence or testing for one chosen section.

### Scene 5 — PCR, 2:30–3:30

**Operator, in order:**

1. Click **95°C — UNZIP / DENATURE** and read the explanation below the tiles.
2. Click **55°C — PRIMERS STICK / ANNEAL**.
3. Click **72°C — COPY / EXTEND**.
4. Click **Show 1 full cycle**. Wait for the button to say **Running one cycle…**, then for the cycle counter to rise.
5. Ask the room to tap **ADD A CLASS TAP** on their phones. Every four class taps move the shared demo forward by one cycle.
6. Click **Jump to cycle 30**. Wait until both PCR buttons say **Cycle 30 reached** and phones show **1.07 BILLION**.

Say before the phone taps:

> “Your taps control this animation; they do not power real PCR. Real PCR changes temperature so DNA unzips, primers stick and an enzyme copies the target.”

> “Perfect doubling for 30 cycles gives 2³⁰ copies—just over 1.07 billion. Real PCR eventually slows down.”

**What this interaction teaches:** Repeated temperature cycles can turn a tiny amount of one chosen DNA section into enough copies to detect.

### Scene 6 — Matching-DNA puzzle, 3:30–4:20

**Audience:** Choose the strand that pairs with `CTGTG`.

**Operator:** Wait for the percentages, then click **Show the match**. Check that the button changes to **Match shown**, `GACAC` fills the lower strand, and the correct option is highlighted.

> “DNA follows a matching rule: A pairs with T, and C pairs with G. That makes GACAC the partner strand.”

> “This is only a five-letter pairing puzzle. Real PCR uses two much longer primers, one on each side of the target.”

**What this interaction teaches:** Complementary base pairing lets primers attach to selected DNA, although real primer design requires more than this toy puzzle.

### Scene 7 — Hand to Student 2, 4:20–4:45

**Operator:** No click on this scene.

> “PCR found the DNA section we looked for. It did not tell us why the glow disappeared or whether the whole circuit works.”

Pass the optional sample tube to Student 2.

> “Now we need to measure the light.”

**What this scene teaches:** Detecting one DNA target does not prove that the cell is using it correctly.

## Student 2 — Nanotechnology and AI

### Scene 8 — Nanoscale, 4:45–5:25

**Audience:** Answer the fingernail-growth question on the phone.

**Operator:** Drag the stage slider slowly from `10⁰ m` to `10⁻⁹ m`. Pause briefly on the named objects and finish at **THE NANOSCALE / 1 nanometre**.

> “A nanometre is one billionth of a metre. A fingernail grows by about one nanometre each second.”

**What this interaction teaches:** Familiar size comparisons make the billionth-of-a-metre scale used in chip making easier to picture.

### Scene 9 — Build a chip pattern with light, 5:25–6:20

**Audience:** Tap **ADD UV LIGHT**. The phone shows each person’s taps and the class total out of 48.

**Operator:** Let several light pulses appear. When the class meter is full—or when it is time to continue—click **Show the later factory steps**. Wait for **Later steps shown** and for **MASK, EXPOSE, ETCH, REPEAT** to light up. Phones should show **PATTERN COMPLETE**.

> “A mask works like a stencil. UV light changes a light-sensitive coating only where it passes through the gaps.”

> “Our taps are symbolic. Real fabrication also needs developing, etching, added materials and many carefully aligned layers.”

**What this interaction teaches:** Photolithography transfers tiny patterns with light, while later chemical and material steps turn those patterns into chip structures.

### Scene 10 — From glow to a number, 6:20–6:55

**Operator:** No click. Student 2 points through the four boxes from left to right.

> “UV light helped make the chip. Now the finished sensor measures a different light: the yeast’s green glow.”

> “The sensor turns that glow into a number. The AI compares it with the DNA reading.”

**What this scene teaches:** A sensor must turn a physical signal into numbers before an AI can process it.

### Scene 11 — Choose the model size, 6:55–7:40

**Audience:** Vote for **2**, **4** or **8** pattern-finding units on the phone.

**Operator:** Wait until the stage shows a chosen number of hidden neurons. Do not start training until Scene 12.

> “Every dot is a checked practice sample with two readings and a known answer. That is the labelled data used for supervised learning.”

> “More hidden units can draw a more flexible dividing line, but they can also fit noise. Bigger is not always better.”

If there are fewer than six training points, press `D`; the next scene will also load practice samples automatically if needed.

**What this interaction teaches:** Model size controls how flexible a learned pattern can be, and extra flexibility is not always useful.

### Scene 12 — Train the AI, 7:40–8:45

**Operator:** Click **Start training**. Watch the progress reach 500 practice rounds. Wait until the phone says **Training complete** and the stage button changes to **Train again**.

Do not click **Start over** during the show. That button clears only the AI model so it can be trained again during rehearsal; it does not reset the whole mission.

> “One epoch is one practice round through all the examples. Loss is the error score, so lower is better.”

> “Practice accuracy uses dots the AI has seen. New-sample accuracy uses separate dots kept out of training.”

> “The colours show the AI’s answer in each area. The edge between them is its dividing line.”

**What this interaction teaches:** Training repeatedly adjusts a model to reduce error, while separate test data gives a fairer check than training data alone.

### Scene 13 — Challenge and retrain the AI, 8:45–9:35

**Audience:** Move both sliders and tap **Ask the AI**. To test another point, move a slider and tap **Ask about the changed point**.

**What the phone challenge teaches:** A trained model uses its learned dividing line to classify a new point.

**Operator, in order:**

1. Wait until the stage’s **people testing** count rises.
2. Read the current HELIX–7 model score aloud.
3. Click **Add 4 checked samples + retrain**.
4. Wait while the button says **Retraining with 4 checked samples…**.
5. Continue only when it says **4 checked samples added** and the status sentence reports how the same sample’s score changed.

> “The yellow rings are four samples checked by a second test. They look normal on our first two readings, but their circuits are changed.”

> “We did not change the answers. We added better evidence, so the dividing line moved.”

> “A model score is not proof, and 80 out of 100 does not automatically mean 80 percent certainty.”

**What the retraining teaches:** A model changes when independently checked examples reveal a pattern that was missing from its original training data.

### Scene 14 — Is the AI enough?, 9:35–10:20

**Audience:** Choose **ACT ON IT** or **MORE TESTS** on the phone.

**Operator:** Wait for the stage bars, then click **Show what scientists do next**. Check that the button says **Checks shown** and the verification box appears.

> “The AI gives a strong answer. Would you act on that alone?”

> “A high score is one clue, not proof. We would repeat the test, sequence the DNA, check contamination and use another detector.”

**What this interaction teaches:** A confident AI result still needs independent evidence before people act on it.

Handoff to Student 3:

> “The result needs checking. Meanwhile, the lab needs a safe path.”

## Student 3 — Astrophysics and Spaceflight

### Scene 15 — What an orbit is, 10:20–11:10

**Audience:** Answer the gravity question on the phone.

**Operator:** Click **TOO SLOW**, then **ORBIT**, then **ESCAPE**. After each click, pause for the path and result sentence to change. Click **ORBIT** once more so that the scene finishes on the circular path.

> “At 400 kilometres, gravity is still about 90 percent as strong as it is at Earth’s surface.”

> “Gravity pulls the spacecraft down while sideways speed carries it forward. At the right speed, it keeps falling and missing Earth.”

> “Astronauts float because they and their spacecraft are falling together.”

**What the phone question teaches:** Astronauts float because spacecraft and crew fall together, not because gravity disappears.

**What the speed buttons teach:** Changing sideways speed changes whether a spacecraft re-enters, orbits or escapes.

### Scene 16 — Correct the orbit, 11:10–12:30

**Audience:** Move the speed slider, then tap **Send this speed**. A changed value is not counted until the phone says **Speed sent**.

**Operator, in order:**

1. Wait for at least one speed choice and point out the room’s middle choice.
2. Click **Test our speed**.
3. Wait through **Testing path…** until the full path and result sentence appear.
4. If the class changes its speeds, wait for **SPEED CHANGED — TEST THE NEW PATH**, then click **Test again**.

> “HELIX–7 starts 400 kilometres up. One short engine burn changes its sideways speed, and gravity shapes the new path.”

> “We use the median—the middle choice when the speeds are sorted—so one extreme phone cannot control the result.”

- Below `0.99×`: the path enters the atmosphere.
- `1.00×`: circular orbit.
- Between the re-entry and escape limits: elliptical orbit.
- `1.42×` or above: escape.

> “After the burn, the engine can stop. A spacecraft in an ideal orbit coasts.”

**What this interaction teaches:** A short change in sideways speed can reshape an entire orbit without continuous engine thrust.

### Scene 17 — Final risk decision, 12:30–13:30

**Audience:** Vote **EARTH**, **ORBIT** or **REMOTE** on the phone.

**Operator:** Wait for the three percentages. Read the leading choice, then ask one person to explain it. If time allows, ask someone to defend the second choice.

> “Returning the sample gives us better tools but brings uncertainty closer to Earth. Keeping it away lowers that risk but limits our tests.”

> “Science can show the risks and benefits. People still decide which risks are acceptable.”

**What this interaction teaches:** Evidence can describe likely consequences, but a responsible decision still involves values and trade-offs.

## Finale — All three, 13:30–15:00

**Operator:** Press `→` to the final scene. No more clicks. Pause on the chain while each student points to their part.

Student 1:

> “Genetics let us build the system and check one section of its DNA.”

Student 2:

> “Nanotechnology turned light into data. The AI compared the pattern, but only after we gave it checked examples.”

Student 3:

> “Astrophysics showed where each speed would take the lab. The final choice still belonged to people.”

One student:

> “Your labels, taps, test samples and speed choices changed what happened.”

All three:

> “What surprised us most is that none of these subjects works alone. Thank you.”

**What this ending teaches:** Difficult scientific problems are often solved by connecting fields rather than treating them as separate subjects.

## Questions the audience may ask

**Is the AI real?** Yes. A small neural network trains live in the stage browser using the simulated samples. It uses backpropagation to adjust its connection numbers. The mission and all measurements are fictional.

**How did you know the first labels?** The opening samples use the stated 60/100 teaching rule. Real labels should come from trusted independent measurements, not from an AI labelling its own training data.

**Why does the model change after the four checked samples?** They show a combination the first dataset missed. Training again moves the dividing line so the network can account for the new evidence.

**Is 100 percent accuracy always good?** No. A tiny, easy or memorised test set can score 100 percent. A trustworthy result needs many more unseen samples.

**Is the model score a probability?** Not automatically. It shows how strongly this model leans towards one label. Reliable probabilities need calibration and much more independent testing.

**Can a microscope read DNA?** It can show DNA material or structures, but routine microscopy does not give a readable A, T, C and G sequence. Scientists use sequencing to read the letters.

**Does PCR read the whole gene?** No. PCR copies a chosen section between two primers. Sequencing and other tests are needed to check the complete sequence and its function.

**Why is the primer puzzle so short?** It only demonstrates complementary base pairing. Real PCR uses two longer primers and requires extra checks.

**Did the phones power PCR or fire single photons?** No. The phone taps control visual models. Real PCR uses a thermocycler, and real photolithography uses a controlled UV exposure containing enormous numbers of photons.

**Was the reporter glow the same light used to make the chip?** No. UV light patterns the chip during fabrication. The green reporter light later comes from the engineered yeast and is measured by a sensor.

**Is there gravity in space?** Yes. At 400 kilometres, gravity is about 90 percent as strong as at Earth’s surface. Astronauts float because they and their spacecraft fall together.

**Why can a small slowdown cause re-entry?** Slowing below the model’s `0.99×` limit makes the opposite side of the orbit dip into the atmosphere, where drag removes more energy.

**Does PCR prove the engineered yeast is safe?** No. It checks only one chosen DNA target. Scientists would still need sequencing, protein measurements, tests of cell behaviour and a full safety review.
