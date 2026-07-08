function hashSeed(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const HERO_AXIS = Array.from({length: 16}, (_, i) => i);

const seed1 = 'yaweg food truck service|yaweg-food-truck-service|food truck booking,festival & pop-up vending,corporate lunch rotation|food truck city|maincity|storyteller';
const seed2 = 'another brand|subdomain|services|city|state|vibe';
const seed3 = '1234';

console.log("seed1", hashSeed(`${seed1}::hero`) % 16);
console.log("seed2", hashSeed(`${seed2}::hero`) % 16);
console.log("seed3", hashSeed(`${seed3}::hero`) % 16);

function weightVector(len, boosts) {
  return Array.from({ length: len }, (_, i) => 1 + (boosts[i] ?? 0));
}

const HERO_WEIGHTS = {
  modern:    weightVector(16, { 1: 3, 7: 3, 9: 2, 10: 2, 4: 2, 15: 1 })
};

function weightedIndex(seed, salt, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = hashSeed(`${seed}::${salt}`) % total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

console.log("weighted 1", weightedIndex(seed1, 'hero', HERO_WEIGHTS.modern));
console.log("weighted 2", weightedIndex(seed2, 'hero', HERO_WEIGHTS.modern));

