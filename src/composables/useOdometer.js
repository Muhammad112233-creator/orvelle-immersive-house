import { ref, reactive, watch, nextTick } from 'vue'

/* ---------------------------------------------------------------------------
   Odometer.

   A column of 0-9 repeated twice scrolls behind a one-digit window. Counting
   up always rolls the reel downward and counting down rolls it upward, so the
   direction of travel matches what just happened.
   --------------------------------------------------------------------------- */

export function useOdometer({ digits = 1, duration = 300 } = {}) {
  const digitCount = ref(typeof digits === 'object' ? digits.value : digits)
  const currentValue = ref(0)
  const digitStyles = reactive([])
  const reelRefs = reactive([])

  const REPEATS = 2 // the reel holds 0-9 twice so it can always roll forward

  function build(value) {
    const count = typeof digits === 'object' ? digits.value : digits
    const text = String(Math.max(0, Math.floor(value))).padStart(count, '0')
    digitStyles.length = 0
    for (let i = 0; i < text.length; i++) {
      const n = Number(text[i])
      digitStyles.push({
        transform: `translateY(${-n * 1}em)`,
        transitionDuration: `${duration}ms`,
        transitionDelay: `${i * 40}ms`,
      })
    }
  }

  function setNumber(value) {
    const previous = currentValue.value
    currentValue.value = value
    const count = typeof digits === 'object' ? digits.value : digits
    const text = String(Math.max(0, Math.floor(value))).padStart(count, '0')

    nextTick(() => {
      digitStyles.length = 0
      for (let i = 0; i < text.length; i++) {
        const n = Number(text[i])
        // Rolling into the second copy of 0-9 keeps 9 → 0 moving downward
        // instead of snapping back up through every digit.
        const offset = value > previous ? n + 10 * (REPEATS - 1) : n
        digitStyles.push({
          transform: `translateY(${-offset}em)`,
          transitionDuration: `${duration}ms`,
          transitionDelay: `${i * 40}ms`,
        })
      }
    })
  }

  build(currentValue.value)

  if (typeof digits === 'object') {
    watch(digits, () => build(currentValue.value))
  }

  return { currentValue, digitStyles, reelRefs, setNumber, digitCount, REPEATS }
}
