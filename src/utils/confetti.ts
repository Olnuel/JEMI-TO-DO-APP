import confetti from 'canvas-confetti';

export function fireGirlyConfetti() {
  const count = 40;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#f472b6', '#fb7185', '#ec4899', '#fbcfe8', '#fef08a', '#e9d5ff', '#fda4af'],
    disableForReducedMotion: true,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function fireSparkleShower() {
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ['#ffb6c1', '#ffc0cb', '#ffe4e1', '#ffd700', '#ff69b4'],
  });
  confetti({
    particleCount: 50,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ['#ffb6c1', '#ffc0cb', '#ffe4e1', '#ffd700', '#ff69b4'],
  });
}
