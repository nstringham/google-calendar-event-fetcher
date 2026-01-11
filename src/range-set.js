export class RangeSet {
  /**
   * All the ranges currently in the set.
   * Each even index is the start of a range.
   * Each odd index is the end of a range.
   * Ranges are arranged in ascending order.
   * @type {number[]}
   */
  #ranges = [];

  /** @param {Iterable<Range>} ranges*/
  constructor(ranges = []) {
    for (const range of ranges) {
      this.addRange(range);
    }
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.#ranges.length; i += 2) {
      yield /** @type {Range} */ ([this.#ranges[i], this.#ranges[i + 1]]);
    }
  }

  /**
   * An array with the ranges in the set.
   * @type {Range[]}
   */
  get ranges() {
    return [...this];
  }

  /**
   * Checks if a range is completely covered by the set.
   * @param {Range} range
   * @returns {boolean}
   */
  hasRange(range) {
    if (!isValidRange(range)) {
      throw new Error("Invalid Range");
    }

    const [start, end] = range;

    const lowerBound = this.#getLowerBoundIndex(start);

    if (lowerBound == null || lowerBound % 2 != 0) {
      return false;
    }

    return end <= this.#ranges[lowerBound + 1];
  }

  /**
   * Adds a range to the set.
   * @param {Range} range
   */
  addRange(range) {
    if (!isValidRange(range)) {
      throw new Error("Invalid Range");
    }

    const [start, end] = range;

    const firstDeleteIndex = this.#getUpperBoundIndex(start);
    if (firstDeleteIndex == null) {
      this.#ranges.push(start, end);
      return;
    }

    const lastDeleteIndex = this.#getLowerBoundIndex(end);
    if (lastDeleteIndex == null) {
      this.#ranges.unshift(start, end);
      return;
    }

    /** @type {number[]} */
    const newValues = [];

    if (firstDeleteIndex % 2 == 0) {
      newValues.push(start);
    }

    if (lastDeleteIndex % 2 != 0) {
      newValues.push(end);
    }

    this.#ranges.splice(firstDeleteIndex, lastDeleteIndex - firstDeleteIndex + 1, ...newValues);
  }

  /**
   * Remove range from the set.
   * @param {Range} range
   */
  removeRange(range) {
    if (!isValidRange(range)) {
      throw new Error("Invalid Range");
    }

    const [start, end] = range;

    const firstDeleteIndex = this.#getUpperBoundIndex(start);
    if (firstDeleteIndex == null) {
      return;
    }

    const lastDeleteIndex = this.#getLowerBoundIndex(end);
    if (lastDeleteIndex == null) {
      return;
    }

    /** @type {number[]} */
    const newValues = [];

    if (firstDeleteIndex % 2 != 0) {
      newValues.push(start);
    }

    if (lastDeleteIndex % 2 == 0) {
      newValues.push(end);
    }

    this.#ranges.splice(firstDeleteIndex, lastDeleteIndex - firstDeleteIndex + 1, ...newValues);
  }

  /**
   * Gets the index of the largest value in `#ranges` that is less than or equal to a given value
   * @param {number} target the value to find
   * @returns {number|null} the index of the largest value that is less than or equal to the target value
   * or null if the target value smaller than the smallest value
   */
  #getLowerBoundIndex(target) {
    if (this.#ranges.length == 0 || this.#ranges[0] > target) {
      return null;
    }
    if (this.#ranges[this.#ranges.length - 1] <= target) {
      return this.#ranges.length - 1;
    }

    /** the index of a value that is less than or equal to the target value */
    let lowerBound = 0;
    /** the index of a value that is greater than the target value */
    let upperBound = this.#ranges.length - 1;

    while (upperBound - lowerBound > 1) {
      const index = Math.floor((lowerBound + upperBound) / 2);
      if (this.#ranges[index] > target) {
        upperBound = index;
      } else {
        lowerBound = index;
      }
    }

    return lowerBound;
  }

  /**
   * Gets the index of the smallest value in `#ranges` that is greater than or equal to a given value
   * @param {number} target the value to find
   * @returns {number|null} the index of the smallest value that is greater than or equal to the target value
   * or null if the target value larger than the largest value
   */
  #getUpperBoundIndex(target) {
    if (this.#ranges.length == 0 || this.#ranges[this.#ranges.length - 1] < target) {
      return null;
    }
    if (this.#ranges[0] >= target) {
      return 0;
    }

    /** the index of a value that is less than the target value */
    let lowerBound = 0;
    /** the index of a value that is greater than or equal to the target value */
    let upperBound = this.#ranges.length - 1;

    while (upperBound - lowerBound > 1) {
      const index = Math.ceil((lowerBound + upperBound) / 2);
      if (this.#ranges[index] < target) {
        lowerBound = index;
      } else {
        upperBound = index;
      }
    }

    return upperBound;
  }
}

/**
 * check if an object is a valid range
 * @param {unknown} range
 * @returns {range is Range}
 */
export function isValidRange(range) {
  return (
    Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number" &&
    range[0] <= range[1]
  );
}

/** @typedef {[start: number, end: number]} Range */
