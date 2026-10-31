export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const;

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 350,
  damping: 32,
} as const;

export const SPRING_SWAP = {
  type: "spring",
  stiffness: 300,
  damping: 28,
} as const;
