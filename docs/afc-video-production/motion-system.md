# AFC Motion System

## What changes now

The AFC explainer will no longer treat a narrated lesson as a sequence of static slides. Every scene must reveal one idea at a time, with visible text that is spoken in the same narration beat.

## Visual grammar

- Begin each concept with a short, bold spoken phrase and a matching colour-forward display title.
- Reveal examples, clues, arrows, data cards, and outcomes one after another. Do not place every element on screen at once.
- Use original real-world AFC imagery only where it helps the learner recognise the situation. Use drawn labels and arrows to connect that image to the concept.
- Use sequentially revealed lines, circles, annotations, and flows. Do not simulate a hand unless an animation system can make the hand track each mark precisely.
- Change format regularly: a photographic context scene, a clean sketchboard, a data-card comparison, a simple process flow, then a reflective end frame.
- Keep the paper background uncluttered. Use cobalt, violet, cyan, and gold for teaching hierarchy rather than decorative noise.

## Narration and pacing

- Keep the narrator at a measured beginner pace. Reduce writing instead of accelerating speech to force a duration target.
- A learner should be able to repeat each on-screen phrase after hearing it once.
- Each displayed phrase must be either said verbatim or removed.
- Captions remain accessible support, never a substitute for the narration.
- The current local draft uses the installed Microsoft Hazel voice at a slower rate, then applies gentle high-pass filtering, compression, and loudness normalisation. This gives the draft more presence without pretending that desktop synthesis is a human performance. Public release should use an approved recorded or licensed neural voice.

## Timed build pattern

The machine-learning opening uses this sequence as the reference implementation:

1. Start with an otherwise blank sketchboard.
2. Reveal the spoken heading character by character.
3. Introduce the real-world image only when the narration names the context.
4. Bring in one card for the spoken example, then one for the spoken clues, then one for the spoken answer.
5. Reveal the directional path and outcome only as the narrator explains the prediction.

Each subsequent lesson scene must use an equivalent cause-and-effect relationship between spoken idea and visual reveal. Photos, 3D objects, short motion loops, diagrams, and icons are all allowed only when they clarify the concept; they are not decoration.

## Reference-informed, independently produced

The production approach takes general lessons from the supplied references: frequent visual changes, meaningful real-world context, sequential whiteboard reveal, and controlled durations. AFC uses its own script, original illustrations, original motion composition, and original hand asset. It does not reuse any source wording, frames, characters, logos, or audio.
