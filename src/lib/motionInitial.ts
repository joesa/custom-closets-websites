import type { TargetAndTransition } from "framer-motion";

/** Skip motion "initial" until after hydration so SSR markup matches the client. */
export function motionInitial(
  hydrated: boolean,
  initial: TargetAndTransition
): false | TargetAndTransition {
  return hydrated ? initial : false;
}
