export const uplifters = [
  {
    id: "tired-heart",
    artwork: "/assets/dua-moments-dawn.jpg",
    scene: "Dawn",
    title: "Ya Allah, I’m so tired. I need Your help.",
    body: [
      "And He knows.",
      "He knows the prayer you repeat.",
      "He knows the ache you cannot explain.",
      "He knows the waiting that is wearing on your heart.",
      "Keep turning back to Him.",
    ],
  },
  {
    id: "dua-not-wasted",
    artwork: "/assets/desert-dua-hero-prayer-mat-1000.jpg",
    scene: "Moonlit dunes",
    title: "Your du’a is not wasted.",
    body: ["What feels delayed to you is never outside the wisdom of Allah."],
  },
  {
    id: "quiet-dua",
    artwork: "/assets/dua-moments-rain.jpg",
    scene: "Rain",
    title: "Allah hears you.",
    body: ["Allah hears the du’a you say clearly and the one that lives quietly in your chest."],
  },
  {
    id: "keep-hoping",
    artwork: "/assets/dua-moments-sunset.jpg",
    scene: "Sunset",
    title: "You are not weak for feeling tired.",
    body: ["Keep asking. Keep hoping. Keep turning back."],
  },
  {
    id: "waiting",
    artwork: "/assets/night.webp",
    scene: "Night sky",
    title: "A delayed answer is not a sign that Allah has forgotten you.",
    body: ["Give yourself permission to rest. You can return to the same prayer again."],
  },
  {
    id: "simple-dua",
    artwork: "/assets/sujood.webp",
    scene: "Sujood",
    title: "Ya Allah, help me.",
    body: ["When your heart feels heavy, let your du’a be simple."],
  },
];

export type Uplifter = (typeof uplifters)[number];
