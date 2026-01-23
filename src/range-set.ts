export class RangeSet {
  /**
   * All the ranges currently in the set.
   * Each even index is the start of a range.
   * Each odd index is the end of a range.
   * Ranges are arranged in ascending order.
   */
  #ranges: number[] = [];

  constructor(ranges: Iterable<Range> = []) {
    for (const range of ranges) {
      this.addRange(range);
    }
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.#ranges.length; i += 2) {
      yield [this.#ranges[i], this.#ranges[i + 1]] as Range;
    }
  }

  get ranges(): Range[] {
    return [...this];
  }

  /**
   * Checks if a range is completely covered by the set.
   */
  hasRange(range: Range): boolean {
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
   */
  addRange(range: Range) {
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

    const newValues: number[] = [];

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
   */
  removeRange(range: Range) {
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

    const newValues: number[] = [];

    if (firstDeleteIndex % 2 != 0) {
      newValues.push(start);
    }

    if (lastDeleteIndex % 2 == 0) {
      newValues.push(end);
    }

    this.#ranges.splice(firstDeleteIndex, lastDeleteIndex - firstDeleteIndex + 1, ...newValues);
  }

  /**
   * Creates a new set containing all the elements not contained in this set.
   * @returns The inverse of `this`
   */
  inverse(): RangeSet {
    const inverse = new RangeSet();
    inverse.#ranges = [Number.NEGATIVE_INFINITY, ...this.#ranges, Number.POSITIVE_INFINITY];
    if (inverse.#ranges[0] == inverse.#ranges[1]) {
      inverse.#ranges.splice(0, 2);
    }
    if (inverse.#ranges.at(-1) == inverse.#ranges.at(-2)) {
      inverse.#ranges.splice(inverse.#ranges.length - 2);
    }
    return inverse;
  }

  /**
   * Create a new set containing elements in both this set and the given set.
   * @returns The intersection of `this` and `other`
   */
  intersection(other: RangeSet): RangeSet {
    const intersection = new RangeSet();

    const rangesA = this.#ranges;
    const rangesB = other.#ranges;

    let indexA = this.#getLowerBoundIndex(other.#ranges[0]) ?? 0;
    let indexB = other.#getLowerBoundIndex(this.#ranges[0]) ?? 0;

    while (indexA < rangesA.length && indexB < rangesB.length) {
      const a = rangesA[indexA];
      const b = rangesB[indexB];
      if (a < b || (a == b && indexA % 2 != 0)) {
        if (indexB % 2 != 0) {
          intersection.#ranges.push(a);
        }
        indexA++;
      } else {
        if (indexA % 2 != 0) {
          intersection.#ranges.push(b);
        }
        indexB++;
      }
    }

    return intersection;
  }

  /**
   * Gets the index of the largest value in `#ranges` that is less than or equal to a given value
   * @param target the value to find
   * @returns the index of the largest value that is less than or equal to the target value
   * or null if the target value smaller than the smallest value
   */
  #getLowerBoundIndex(target: number): number | null {
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
   * @param target the value to find
   * @returns the index of the smallest value that is greater than or equal to the target value
   * or null if the target value larger than the largest value
   */
  #getUpperBoundIndex(target: number): number | null {
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
 */
export function isValidRange(range: unknown): range is Range {
  return (
    Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number" &&
    range[0] < range[1]
  );
}

export type Range = [start: number, end: number];
