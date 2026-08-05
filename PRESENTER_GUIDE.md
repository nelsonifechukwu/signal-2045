# SIGNAL / 2045 — Presenter Guide

The best performance style is calm and precise. Do not rush to explain every word on the screen. Let the visual land, ask the question, accept the audience input, and then give the scientific meaning.

The recurring rhythm is:

**Predict → commit → visible consequence → explain.**

## Before the presentation

- Replace the placeholder names in `public/show-config.js`.
- Open the stage, press `F`, and leave the QR lobby visible as people enter.
- Connect at least two test phones.
- Test `D` so every presenter knows the fallback.
- Decide who operates the laptop. The current speaker should normally talk without touching it.
- Optional prop: pass a small transparent sample tube at each handoff.

## Student 1 — Molecular Systems Lead

### Scene 1 — The anomaly, 0:00–0:30

> “At 08:17, a laboratory the size of a shoebox gave two answers to one question. Its DNA test looked normal. Its status light did not.”

> “HELIX–7 is travelling at 27,600 kilometres per hour. We have fifteen minutes to decide what happens to it.”

### Scene 2 — The mission, 0:30–1:05

> “No single one of us can solve this. I can test the genetic instruction. Student Two can turn its light into data and train a machine. Student Three can keep the evidence in the correct orbit.”

Each presenter steps forward when introduced.

### Scene 3 — What was engineered, 1:05–1:50

> “We gave sealed yeast a gene circuit. Think of it as an instruction with a status light: promoter, model-protein gene, fluorescent reporter, stop.”

> “Radiation crossed the orbit. PCR still detects our edited gene, but the reporter light fell. Is the DNA damaged, is the cell failing to read it, or is the detector wrong?”

Do not call the model protein medicine. It is a fictional research stand-in.

### Scene 4 — Why not just look?, 1:50–2:30

Ask the room to answer on phones before pressing **Reveal**.

> “The stringy material in a DNA extraction is real DNA mixed with proteins and debris. But seeing the material is not reading its letters.”

> “It is like seeing a six-billion-letter library from the Moon. Instead of building a stronger telescope, PCR makes more copies of one sentence.”

### Scene 5 — PCR, 2:30–3:30

Click the three temperature tiles while explaining one full cycle:

1. **95°C — denature:** hydrogen bonds separate the strands.
2. **About 55–65°C — anneal:** primers bind to complementary targets.
3. **72°C — extend:** heat-stable Taq polymerase builds from each primer.

Then invite everyone to tap.

> “One full cycle can double the target. Thirty ideal cycles give 2³⁰—just over 1.07 billion copies. Real reactions are less efficient and eventually plateau.”

### Scene 6 — Primer puzzle, 3:30–4:20

> “Polymerase needs a starting point. The primer is a molecular bookmark, and its base sequence supplies specificity.”

After the votes, reveal `GACAC`.

> “A pairs with T. C pairs with G. Matching the target makes GACAC. PCR confirms this selected paragraph; it does not check the whole genetic book.”

### Scene 7 — Handoff, 4:20–4:45

> “We found the page in the book. I still cannot tell whether the cell read it correctly.”

Pass the sample prop to Student 2.

> “Turn biology into a signal.”

## Student 2 — Nano + Intelligence Lead

### Scene 8 — Nanoscale, 4:45–5:25

Move the scale slider steadily from 10⁰ to 10⁻⁹ metres.

> “Nano means one-billionth. A useful scale anchor is that a fingernail grows roughly one nanometre each second.”

### Scene 9 — Photolithography, 5:25–6:20

> “A chip is not drawn with a microscopic pen. A patterned mask controls where light reaches a light-sensitive coating called photoresist.”

Invite the room to fire photons.

> “This is a symbolic exposure. In fabrication, developing, etching, deposition and many carefully aligned layers turn the transferred pattern into structures.”

Press **Complete exposure** if the room is small.

### Scene 10 — Photon to prediction, 6:20–6:55

Point across the four stages.

> “The chip can detect reporter photons, turn them into electrical charge, and process the resulting numbers. It does not understand the experiment. It only measures.”

### Scene 11 — Human-labelled data, 6:55–7:40

> “Every dot came from a synthetic control inspected by somebody here. Two features go in: PCR target match and reporter light. A human label tells the model what answer to learn.”

> “The room is also choosing capacity. A larger hidden layer can learn a more flexible boundary—but flexibility can learn noise.”

If there are fewer than six points, press `D`.

### Scene 12 — Train live, 7:40–8:45

Press **Train live model** and pause while the heatmap changes.

> “The network begins with random weights. It predicts, compares its answer with a known label, measures loss and adjusts those weights. One pass through the examples is an epoch.”

> “Training accuracy measures the points it has already seen. Test accuracy uses separate controls withheld from training.”

### Scene 13 — Challenge and contamination, 8:45–9:35

Invite phones to move a new point and query the network.

> “The network was never programmed with a fixed life-or-no-life rule. Its boundary emerged from examples.”

Then press **Inject radiation-damaged controls + retrain**.

> “These new controls occupy a region the model had associated with an intact circuit. Watch the boundary move. The satellite did not change. The dataset did.”

> “The displayed number is a model score. It is not proof, and without calibration it is not a literal probability.”

### Scene 14 — Audit, 9:35–10:20

Take the vote, then reveal protocol.

> “Strong science tries to disprove itself. We repeat the test, sequence DNA, check contamination, use independent instruments and compare alternative explanations.”

Handoff:

> “We have a pattern worth investigating. Now keep the evidence in orbit long enough to act on it.”

## Student 3 — Flight Dynamics Lead

### Scene 15 — What orbit really is, 10:20–11:10

Show **Too slow**, **Orbit**, then **Escape**.

> “Orbit is not a place beyond gravity. At 400 kilometres, gravity is still close to 90 percent of surface gravity.”

> “The spacecraft moves sideways so quickly that while gravity pulls it down, Earth curves away beneath it. It falls and continually misses.”

> “Astronauts feel weightless because astronaut and spacecraft are falling together.”

### Scene 16 — Collective trajectory, 11:10–12:30

Give the room 20 seconds to set a speed, then press **Run class trajectory**.

> “We are using the median command, so one extreme phone cannot dominate. This is a real simplified two-body calculation: acceleration always points toward Earth and changes with distance.”

If the path crashes or escapes:

> “That is not a software failure. It is a physics result. Adjust your commands and let us try once more.”

If it orbits:

> “No continuous thrust is holding it up. In an ideal orbit it coasts; engines are used to launch, manoeuvre and correct disturbances.”

### Scene 17 — Responsible recovery, 12:30–13:30

> “Science tells us what each option makes possible. It cannot choose our acceptable risk for us.”

Read the leading result. Ask one person to defend it and one to defend the runner-up.

## Finale — All three, 13:30–15:00

Student 1:

> “We changed a biological instruction—and designed a test for it.”

Student 2:

> “We patterned matter with light—and trained a machine on evidence you created.”

Student 3:

> “We used gravity as part of the flight—and kept the final decision human.”

All together:

> “The future is not one science. It is what happens between them.”

## Questions the audience may ask

**Is the AI real?** Yes. It is a small multilayer perceptron trained live in the browser using backpropagation. The scenario and measurements are synthetic.

**Why does the model change after the radiation controls?** It receives new labelled examples in a previously misleading region of feature space. Its learned boundary adjusts to reduce error across the new training set.

**Is 100% accuracy good?** It can be, but it can also mean the dataset is easy, small or memorised. That is why the program separately shows withheld-test accuracy and why real science needs larger independent validation.

**Is there no gravity in space?** There is substantial gravity in low Earth orbit. Orbital weightlessness is shared freefall.

**Does PCR prove the engineered gene is safe?** No. It detects a selected target. Sequencing, protein assays, functional testing and containment review would still be required.
