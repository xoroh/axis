import { describe, expect, test } from "bun:test";
import {
  classifyComponentImports,
  extractImports,
} from "./boundary-policy.mjs";

/**
 * Boundary-policy mutation suite. Each case is a miniature component
 * file: approved shapes pass, smuggled dependencies fail. Run in CI as
 * part of the boundary step — a gate whose own tests do not run is a
 * comment, not a gate.
 */

const APPROVED = `import { useCallback } from "react";
import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { useControllableState } from "../useControllableState";
`;

describe("extractImports", () => {
  test("parses multiline named imports with type markers", () => {
    const found = extractImports(
      `import {\n  Pressable,\n  type StyleProp,\n  View,\n} from "react-native";`,
    );
    expect(found).toHaveLength(1);
    expect(found[0].module).toBe("react-native");
    expect(found[0].names).toEqual([
      { name: "Pressable", isType: false },
      { name: "StyleProp", isType: true },
      { name: "View", isType: false },
    ]);
  });

  test("default and side-effect imports yield their module", () => {
    const found = extractImports(
      `import React from "react";\nimport "./polyfill";`,
    );
    expect(found.map((f) => f.module)).toEqual(["react", "./polyfill"]);
  });
});

describe("classifyComponentImports", () => {
  test("approved component imports pass", () => {
    expect(classifyComponentImports("components/Switch.tsx", APPROVED)).toEqual(
      [],
    );
  });

  test("unauthorized external package fails", () => {
    const failures = classifyComponentImports(
      "components/Fancy.tsx",
      `${APPROVED}import { gravitate } from "motion-magic";\n`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("motion-magic");
  });

  test("unlisted react-native binding fails", () => {
    const failures = classifyComponentImports(
      "components/Fancy.tsx",
      `import { FlatList } from "react-native";\n`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("FlatList");
  });

  test("forbidden design-system and web-only imports fail", () => {
    for (const mod of [
      "@xoroh/kern-primitives",
      "@xoroh/kern-tokens",
      "react-dom",
      "expo",
    ]) {
      const failures = classifyComponentImports(
        "components/Fancy.tsx",
        `import { x } from "${mod}";\n`,
      );
      expect(failures.length).toBeGreaterThan(0);
    }
  });

  test("escapes above src fail", () => {
    const failures = classifyComponentImports(
      "components/Fancy.tsx",
      `import { secret } from "../../elsewhere";\n`,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("escapes src");
  });

  test("sibling and parent-internal relative imports stay valid", () => {
    expect(
      classifyComponentImports(
        "components/Fancy.tsx",
        `import { useControllableState } from "../useControllableState";\nimport { helper } from "./helper";\n`,
      ),
    ).toEqual([]);
  });
});
