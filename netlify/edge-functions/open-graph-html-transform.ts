import { Context } from "@netlify/edge-functions";
import { HTMLRewriter } from "https://ghuc.cc/worker-tools/html-rewriter/index.ts";

const cdnHost = "https://cdn.kinopio.club";

function getSpaceOgImage(spaceId: string) {
  return `${cdnHost}/${spaceId}/preview-image-${spaceId}.webp`;
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);

  // Assets
  if (url.pathname.includes(".")) {
    return;
  }

  if (url.pathname === '/') {
    return;
  }

  const spaceId = url.pathname.split('-').pop()

  if (!spaceId) {
    return;
  }

  const response = await context.next();
  const rewriter = new HTMLRewriter()
    .on('meta[property="og:image"]', {
      element: (element) => {
        element.setAttribute("content", getSpaceOgImage(spaceId));
      },
    })
    .on('meta[property="og:image:width"]', {
      element: (element) => {
        element.setAttribute("content", "1180");
      },
    })
    .on('meta[property="og:image:height"]', {
      element: (element) => {
        element.setAttribute("content", "670");
      },
    })
    .on('meta[property="og:image:type"]', {
      element: (element) => {
        element.setAttribute("content", "image/jpeg");
      },
    });

  return rewriter.transform(response);
}
