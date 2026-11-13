import { PassThrough } from "node:stream";
import * as React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Badge } from "../badge/badge.js";
import { Button } from "./button.js";

/**
 * usetheodev/usetheo-ui#18 — a page importing `Button` must not stream in two pieces.
 *
 * The reported symptom: React's SSR flushes the shell first and delivers the content afterwards
 * inside a `<div hidden id="S:0">` for a client script to move into place. The reader watches the
 * page assemble itself — measured as CLS 1.12 against a 0.1 "good" threshold on a docs site whose
 * every code block renders a `CopyButton`, with `<footer>` served ahead of `<article>`.
 *
 * `Badge` from the same entry point does not do it, which is what made it a component question
 * rather than a framework one.
 *
 * The A/B lives here rather than in the consumer because that is what the issue asks for: rendering
 * both through this package's own SSR path is the only way to tell a defect in the component from
 * one in the consumer's bundler. `renderToPipeableStream` piped on `onShellReady` is the
 * arrangement the report used.
 */

/** The rendered HTML, flushed the way the reporting app flushes it. */
async function renderStreamed(element: React.ReactElement): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new PassThrough();
    sink.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    sink.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    sink.on("error", reject);

    const { pipe, abort } = renderToPipeableStream(element, {
      onShellReady() {
        pipe(sink);
      },
      onShellError: reject,
      onError: reject,
    });
    // A component that never resolves would hang the suite rather than fail it.
    setTimeout(() => {
      abort();
      reject(new Error("SSR did not complete within 5s"));
    }, 5000).unref?.();
  });
}

/**
 * Whether React deferred part of the tree.
 *
 * `<div hidden id="S:…">` is the placeholder React emits for content that arrived after the shell;
 * `$RS`/`$RC` are the client runtime functions that move it into place. Any of them means the page
 * was served in two pieces, which is the defect — not the exact marker, which is a React internal.
 */
function streamedInTwoPieces(html: string): boolean {
  return /<div hidden id="S:\d+"/.test(html) || html.includes("$RS") || html.includes("$RC");
}

describe("#18 — SSR delivers the page in one piece", () => {
  it("test_badge_does_not_stream", async () => {
    // The control. If this ever starts failing, the A/B below stops meaning anything — it would be
    // measuring the harness rather than the components.
    expect(streamedInTwoPieces(await renderStreamed(<Badge>probe</Badge>))).toBe(false);
  });

  it("test_button_does_not_stream_either", async () => {
    // The reported case, at the exact props from the report.
    expect(streamedInTwoPieces(await renderStreamed(<Button variant="ghost">probe</Button>))).toBe(
      false,
    );
  });

  it("test_button_with_asChild_does_not_stream", async () => {
    // The branch that actually renders `Slot`. At default props `asChild` is false and `Comp` is
    // the string "button", so the plain case never exercises Radix at all — testing only that one
    // would leave the more suspicious path unmeasured.
    const html = await renderStreamed(
      <Button asChild>
        <a href="/x">probe</a>
      </Button>,
    );
    expect(streamedInTwoPieces(html)).toBe(false);
  });

  it("test_both_render_their_markup_in_place", async () => {
    // Anti-vacuity. A render that produced nothing at all would contain no streaming markers and
    // pass every assertion above.
    expect(await renderStreamed(<Badge>probe</Badge>)).toContain("probe");
    const button = await renderStreamed(<Button variant="ghost">probe</Button>);
    expect(button).toContain("probe");
    expect(button).toContain("<button");
  });

  it("test_the_detector_recognises_a_tree_that_really_does_stream", async () => {
    // The assertion that keeps the other four honest: a detector that never fires would pass this
    // whole file against a genuinely broken build. A Suspense boundary with a promise-throwing
    // child is the shape React defers, so this MUST come back true.
    let resolved = false;
    const Slow = (): React.ReactElement => {
      if (!resolved) {
        throw new Promise<void>((resolve) => {
          setTimeout(() => {
            resolved = true;
            resolve();
          }, 10);
        });
      }
      return <span>late</span>;
    };
    const html = await renderStreamed(
      <div>
        <span>shell</span>
        <React.Suspense fallback={<span>loading</span>}>
          <Slow />
        </React.Suspense>
      </div>,
    );
    expect(streamedInTwoPieces(html)).toBe(true);
  });
});
