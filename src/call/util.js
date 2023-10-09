/**
 * Returns a whole number between the given min and max
 * @param {number} min
 * @param {number} max
 * @returns
 */
export default function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
