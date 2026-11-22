import { Hono, type Context } from "hono";
import { z } from "zod";

type Harness = (
  c: Context,
  path: string,
  body?: unknown,
  mime?: string,
) => Promise<unknown>;
export type ReadPhoto = (id: string) => Response | Promise<Response>;
const identifier = z.string().regex(/^[\w-]{1,128}$/);
const turn = z.object({
  photoId: z.uuid(),
  botId: identifier,
  threadId: identifier,
  sendId: z.uuid(),
  question: z.string().trim().min(1).max(4000),
});
export function photoTurnApi(harness: Harness, readPhoto: ReadPhoto) {
  const app = new Hono();
  app.post("/", async (c) => {
    const input = turn.safeParse(await c.req.json().catch(() => null));
    if (!input.success)
      return c.json(
        { error: "Choose a picture and a character, then enter a question." },
        400,
      );
    const { photoId, botId, threadId, sendId, question } = input.data;
    const response = await readPhoto(photoId);
    if (!response.ok)
      return c.json({ error: "This photo is no longer in the gallery." }, 404);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024)
      return c.json(
        {
          error:
            "OpenMausBot accepts images up to 10 MB. Choose a smaller photo.",
        },
        413,
      );
    const roster = z
      .object({
        bots: z.array(
          z.object({
            id: identifier,
            threadId: identifier,
            hidden: z.boolean().optional(),
          }),
        ),
      })
      .parse(await harness(c, "/api/bots?messages=0"));
    if (
      !roster.bots.some(
        (bot) => !bot.hidden && bot.id === botId && bot.threadId === threadId,
      )
    ) {
      return c.json(
        {
          error:
            "This character’s conversation changed. Choose the character again.",
        },
        409,
      );
    }
    const attachment = z
      .object({
        path: z
          .string()
          .min(1)
          .regex(/^[^\r\n]+$/),
      })
      .parse(
        await harness(
          c,
          "/api/attachments?uploadId=" + sendId,
          bytes,
          response.headers.get("Content-Type")!,
        ),
      );
    const path = attachment.path
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const result = z.object({ threadId: identifier }).parse(
      await harness(c, "/api/bots/" + botId + "/messages", {
        sendId,
        threadId,
        text: question + '\n\n<attached-image path="' + path + '" />',
      }),
    );
    if (result.threadId !== threadId)
      throw Error("OpenMausBot returned a different conversation.");
    return c.json(result);
  });
  return app;
}
