// FIXME: replace multiple 1 import from skypack!?
import type {
  HTMLRewriter as BaseHTMLRewriter,
  ContentTypeOptions,
  Element,
  EndTag,
  Comment,
  TextChunk,
  Doctype,
  DocumentEnd,
  ElementHandlers,
  DocumentHandlers,
} from "./vendor/html_rewriter.d.ts";
import * as _base from './vendor/html_rewriter.js'
const { default: initWASM } = _base;
const base: typeof import("./vendor/html_rewriter.d.ts") = _base;

export type {
  ContentTypeOptions,
  Element,
  EndTag,
  Comment,
  TextChunk,
  Doctype,
  DocumentEnd,
  ElementHandlers,
  DocumentHandlers,
}

import { ResolvablePromise } from 'https://ghuc.cc/worker-tools/resolvable-promise/index.ts'

type SelectorElementHandlers = [selector: string, handlers: ElementHandlers];

const kEnableEsiTags = Symbol("kEnableEsiTags");

// In case a server doesn't return the proper mime type (e.g. githubusercontent.com)..
const toWASMResponse = (response: Response) => {
  if (response.headers.get('content-type')?.startsWith('application/wasm')) return response;
  const { body, headers: hs, ...props } = response
  const headers = new Headers(hs)
  headers.set('content-type', 'application/wasm')
  return new Response(body, { ...props, headers })
}

const initialized = new ResolvablePromise<void>();
let executing = false;

export class HTMLRewriter {
  readonly #elementHandlers: SelectorElementHandlers[] = [];
  readonly #documentHandlers: DocumentHandlers[] = [];
  [kEnableEsiTags] = false;

  constructor() {
    if (!initialized.settled && !executing) {
      executing = true;
      fetch(new URL("./vendor/html_rewriter_bg.wasm", import.meta.url).href)
        .then(r => r.ok ? r : (() => { throw Error('WASM response not ok') })())
        .then(toWASMResponse)
        .then(initWASM)
        .then(() => initialized.resolve())
        .catch(err => {
          executing = false;
          console.error(err);
        })
    }
  }

  on(selector: string, handlers: ElementHandlers): this {
    this.#elementHandlers.push([selector, handlers]);
    return this;
  }

  onDocument(handlers: DocumentHandlers): this {
    this.#documentHandlers.push(handlers);
    return this;
  }

  transform(response: Response): Response {
    const body = response.body as ReadableStream<Uint8Array> | null;
    // HTMLRewriter doesn't run the end handler if the body is null, so it's
    // pointless to setup the transform stream.
    if (body === null) return new Response(body, response);

    if (response instanceof Response) {
      // Make sure we validate chunks are BufferSources and convert them to
      // Uint8Arrays as required by the Rust glue code.
      response = new Response(response.body, response);
    }

    let rewriter: BaseHTMLRewriter;
    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      start: async (controller) => {
        // Create a rewriter instance for this transformation that writes its
        // output to the transformed response's stream. Note that each
        // BaseHTMLRewriter can only be used once.
        await initialized;
        rewriter = new base.HTMLRewriter(
          (output) => {
            // enqueue will throw on empty chunks
            if (output.length !== 0) controller.enqueue(output);
          },
          { enableEsiTags: this[kEnableEsiTags] }
        );
        // Add all registered handlers
        for (const [selector, handlers] of this.#elementHandlers) {
          rewriter.on(selector, handlers);
        }
        for (const handlers of this.#documentHandlers) {
          rewriter.onDocument(handlers);
        }
      },
      // The finally() below will ensure the rewriter is always freed.
      // chunk is guaranteed to be a Uint8Array as we're using the
      // @miniflare/core Response class, which transforms to a byte stream.
      transform: (chunk) => rewriter.write(chunk),
      flush: () => rewriter.end(),
    });
    const promise = body.pipeTo(transformStream.writable);
    promise.catch(() => {}).finally(() => rewriter?.free());

    // Return a response with the transformed body, copying over headers, etc
    const res = new Response(transformStream.readable, response);
    // If Content-Length is set, it's probably going to be wrong, since we're
    // rewriting content, so remove it
    res.headers.delete("Content-Length");
    return res;
  }
}

export function withEnableEsiTags(rewriter: HTMLRewriter): HTMLRewriter {
  rewriter[kEnableEsiTags] = true;
  return rewriter;
}
