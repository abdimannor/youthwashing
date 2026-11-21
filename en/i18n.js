// English UI strings for the shared scripts (motion.js, assess.js, workshop.js).
// Loaded before them on the English pages; the Swedish defaults live in each script.
window.YW_I18N = {
  motion: {
    label: 'Animations: ', on: 'on', off: 'off', region: 'Animations',
    notice: 'Your device asks for reduced motion, so the animations are paused.',
    play: '▶ Play the animations', keep: 'Keep still',
  },
  assess: {
    labels: { timing: 'Timing', mandat: 'Mandate', resurser: 'Resources', aterkoppling: 'Feedback' },
    words: ['No', 'Partly', 'Yes'],
    cardTitle: 'HOW REAL IS THE INFLUENCE?',
    signals: 'Warning signs',
    of3: (n) => `${n} of 3`,
    cardUrl: 'abdimannor.github.io/youthwashing/en',
    cardLabel: 'Result card',
    exampleA: 'Example A',
    exampleB: 'Example B',
    firstExample: 'The first example',
    file: 'influence',
    copied: 'Link copied',
    shareTitle: 'How real is the influence?',
  },
  workshop: {
    count: (n, total) => `Slide ${n} of ${total}`,
    hash: 'slide',
    timeUp: 'Time is up',
  },
};
