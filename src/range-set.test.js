import { describe, expect, it } from "vitest";
import { isValidRange, RangeSet } from "./range-set.js";

/** @import { Range } from "./range-set.js" */

describe("isValidRange", () => {
  it("returns true for valid ranges", () => {
    expect(isValidRange([1, 2])).toBe(true);
    expect(isValidRange([18, 56789])).toBe(true);
    expect(isValidRange([1, 1])).toBe(true);
    expect(isValidRange([0, 0])).toBe(true);
    expect(isValidRange([-1000, -100])).toBe(true);
    expect(isValidRange([Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER])).toBe(true);
    expect(isValidRange([-Number.MIN_VALUE, Number.MIN_VALUE])).toBe(true);
    expect(isValidRange([-Number.EPSILON, Number.EPSILON])).toBe(true);
    expect(isValidRange([-Number.MAX_VALUE, Number.MAX_VALUE])).toBe(true);
    expect(isValidRange([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY])).toBe(true);
    expect(isValidRange([-0, 0])).toBe(true);
  });

  it("returns false for invalid ranges", () => {
    expect(isValidRange(null)).toBe(false);
    expect(isValidRange(undefined)).toBe(false);
    expect(isValidRange("[1, 2]")).toBe(false);
    expect(isValidRange(["1", "2"])).toBe(false);
    expect(isValidRange({ [0]: 1, [1]: 2, length: 2 })).toBe(false);
    expect(isValidRange([new Date(), new Date()])).toBe(false);
    expect(isValidRange([2, 1])).toBe(false);
    expect(isValidRange([NaN, NaN])).toBe(false);
    expect(isValidRange([Number.MIN_VALUE, -Number.MIN_VALUE])).toBe(false);
    expect(isValidRange([Number.EPSILON, 0])).toBe(false);
  });
});

describe("RangeSet", () => {
  describe("constructor", () => {
    it("creates an empty set when given no arguments", () => {
      const set = new RangeSet();
      expect(set.ranges).toEqual([]);
    });

    it("can be initialize with an array of ranges", () => {
      const set = new RangeSet([
        [1, 2],
        [4, 5],
      ]);
      expect(set.ranges).toEqual([
        [1, 2],
        [4, 5],
      ]);
    });

    it("can be initialize with a set of ranges", () => {
      const set = new RangeSet(
        new Set([
          [1, 2],
          [4, 5],
        ]),
      );
      expect(set.ranges).toEqual([
        [1, 2],
        [4, 5],
      ]);
    });

    it("simplifies ranges during initialization", () => {
      const set = new RangeSet([
        [1, 2],
        [4, 6],
        [8, 9],
        [2, 3],
        [5, 6],
        [5, 8],
      ]);
      expect(set.ranges).toEqual([
        [1, 3],
        [4, 9],
      ]);
    });
  });

  describe("[Symbol.iterator]", () => {
    it("iterates through simplified ranges", () => {
      const set = new RangeSet([
        [1, 2],
        [5, 6],
        [4, 5],
      ]);

      const iterator = set[Symbol.iterator]();
      expect(iterator.next()).toEqual({ done: false, value: [1, 2] });
      expect(iterator.next()).toEqual({ done: false, value: [4, 6] });
      expect(iterator.next()).toEqual({ done: true, value: undefined });
      expect(iterator.next()).toEqual({ done: true, value: undefined });
    });

    it("has iterator helper functions", () => {
      const set = new RangeSet();

      const iterator = set[Symbol.iterator]();

      expect(iterator.map).toBeTypeOf("function");
      expect(iterator.filter).toBeTypeOf("function");
      expect(iterator.reduce).toBeTypeOf("function");
      expect(iterator.toArray).toBeTypeOf("function");
    });
  });

  describe("hasRange", () => {
    it("returns true for inputs matching ranges in the set", () => {
      const set = new RangeSet([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
      expect(set.hasRange([1, 2])).toBe(true);
      expect(set.hasRange([3, 4])).toBe(true);
      expect(set.hasRange([5, 6])).toBe(true);
    });

    it("returns true for inputs that are sub-ranges of ranges in the set", () => {
      const set = new RangeSet([[3, 7]]);
      expect(set.hasRange([3, 5])).toBe(true);
      expect(set.hasRange([4, 6])).toBe(true);
      expect(set.hasRange([5, 7])).toBe(true);
    });

    it("returns false for inputs that are not in the set", () => {
      const set = new RangeSet([
        [1, 2],
        [5, 7],
      ]);
      expect(set.hasRange([0, 1])).toBe(false);
      expect(set.hasRange([2, 5])).toBe(false);
      expect(set.hasRange([7, 9])).toBe(false);
      expect(set.hasRange([3, 4])).toBe(false);
      expect(set.hasRange([100, 200])).toBe(false);
    });

    it("returns false for inputs that extend beyond ranges in the set", () => {
      const set = new RangeSet([[4, 6]]);
      expect(set.hasRange([3, 5])).toBe(false);
      expect(set.hasRange([3, 7])).toBe(false);
      expect(set.hasRange([5, 7])).toBe(false);
    });

    it("returns false for inputs that have gaps in the set", () => {
      const set = new RangeSet([
        [1, 3],
        [6, 9],
      ]);
      expect(set.hasRange([1, 7])).toBe(false);
      expect(set.hasRange([1, 9])).toBe(false);
      expect(set.hasRange([2, 9])).toBe(false);
    });

    it("throws an error if an invalid range is checked", () => {
      const set = new RangeSet();
      expect(() => set.hasRange([-1, -2])).toThrow("Invalid Range");
    });
  });

  describe("addRange", () => {
    it("adds a range to the set", () => {
      const set = new RangeSet();

      set.addRange([5, 6]);
      expect(set.ranges).toEqual([[5, 6]]);

      set.addRange([1, 2]);
      expect(set.ranges).toEqual([
        [1, 2],
        [5, 6],
      ]);

      set.addRange([8, 9]);
      expect(set.ranges).toEqual([
        [1, 2],
        [5, 6],
        [8, 9],
      ]);

      set.addRange([3, 4]);
      expect(set.ranges).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
        [8, 9],
      ]);
    });

    it("ignores duplicates", () => {
      const set = new RangeSet();

      set.addRange([1, 2]);
      expect(set.ranges).toEqual([[1, 2]]);

      set.addRange([1, 2]);
      expect(set.ranges).toEqual([[1, 2]]);
    });

    it("merges overlapping ranges", () => {
      const set = new RangeSet();

      set.addRange([1, 3]);
      expect(set.ranges).toEqual([[1, 3]]);

      set.addRange([2, 4]);
      expect(set.ranges).toEqual([[1, 4]]);

      set.addRange([6, 8]);
      expect(set.ranges).toEqual([
        [1, 4],
        [6, 8],
      ]);

      set.addRange([3, 7]);
      expect(set.ranges).toEqual([[1, 8]]);
    });

    it("merges adjacent ranges", () => {
      const set = new RangeSet();

      set.addRange([1, 2]);
      expect(set.ranges).toEqual([[1, 2]]);

      set.addRange([2, 3]);
      expect(set.ranges).toEqual([[1, 3]]);

      set.addRange([5, 6]);
      expect(set.ranges).toEqual([
        [1, 3],
        [5, 6],
      ]);

      set.addRange([3, 5]);
      expect(set.ranges).toEqual([[1, 6]]);
    });

    it("throws an error if an invalid range is added", () => {
      const set = new RangeSet();
      expect(() => set.addRange([3, 2])).toThrow("Invalid Range");
    });
  });

  describe("removeRange", () => {
    it("removes a range from the set", () => {
      const set = new RangeSet([
        [1, 2],
        [3, 4],
        [5, 6],
        [8, 9],
      ]);

      set.removeRange([3, 4]);
      expect(set.ranges).toEqual([
        [1, 2],
        [5, 6],
        [8, 9],
      ]);

      set.removeRange([8, 9]);
      expect(set.ranges).toEqual([
        [1, 2],
        [5, 6],
      ]);

      set.removeRange([1, 2]);
      expect(set.ranges).toEqual([[5, 6]]);

      set.removeRange([5, 6]);
      expect(set.ranges).toEqual([]);
    });

    it("does nothing when removing a range that doesn't exist", () => {
      const set = new RangeSet([[1, 2]]);

      set.removeRange([1, 2]);
      expect(set.ranges).toEqual([]);

      set.removeRange([1, 2]);
      expect(set.ranges).toEqual([]);
    });

    it("deletes ranges within existing range", () => {
      const set = new RangeSet([[1, 8]]);

      set.removeRange([3, 7]);
      expect(set.ranges).toEqual([
        [1, 3],
        [7, 8],
      ]);

      set.removeRange([6, 8]);
      expect(set.ranges).toEqual([[1, 3]]);

      set.removeRange([2, 4]);
      expect(set.ranges).toEqual([[1, 2]]);

      set.removeRange([1, 3]);
      expect(set.ranges).toEqual([]);
    });

    it("deletes multiple overlapping ranges", () => {
      const set = new RangeSet([
        [1, 2],
        [3, 4],
        [5, 6],
        [8, 9],
      ]);

      set.removeRange([1.5, 8.5]);
      expect(set.ranges).toEqual([
        [1, 1.5],
        [8.5, 9],
      ]);
    });

    it("throws an error if an invalid range is removed", () => {
      const set = new RangeSet();
      expect(() => set.removeRange([3, 2])).toThrow("Invalid Range");
    });
  });
});
