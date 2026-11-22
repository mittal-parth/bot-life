import { PanelPaper } from "./PanelPaper.tsx";
import {
  DrawablyButton,
  DrawablyTextarea,
  DrawablySelect,
} from "drawably/react";
import type { Desk } from "./BotDesk.tsx";
import { useEffect, useRef, useState } from "react";
import { photoCollections, photoLimit } from "../shared/photos.ts";
import type { Photo } from "../shared/photos.ts";
import "./gallery.css";

const api = "/api/photos";
const image = (photo: Photo) => api + "/" + photo.id + "/image";
async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.error || "The gallery could not complete this request.",
    );
  }
  return response;
}

export function PhotoGallery({
  onClose,
  desk,
}: {
  onClose: () => void;
  desk: Desk;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selection, select] = useState<Photo | null>(null);
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState("");
  const [question, setQuestion] = useState("");
  const pendingTurn = useRef({ key: "", id: "" });
  const worker = desk.bots.find((bot) => bot.id === recipient) ?? desk.bot;
  const [collection, filter] = useState("");
  const [busy, setBusy] = useState("Loading photos…");
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const collections = photoCollections(photos);
  const group = collections.find((group) => group.title === collection);
  const visible = group?.photos ?? photos;

  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    const controller = new AbortController();
    request(api, { signal: controller.signal })
      .then((response) => response.json())
      .then((body) => {
        if (!controller.signal.aborted) setPhotos(body.photos);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy("");
      });
    return () => {
      controller.abort();
      modal?.close();
    };
  }, []);

  async function importPhotos(files: File[]) {
    filter("");
    setError("");
    const failures: string[] = [];
    for (const [index, file] of files.entries()) {
      setBusy("Adding " + (index + 1) + " of " + files.length + "…");
      try {
        if (file.size > photoLimit)
          throw new Error("Choose a photo under 12 MB.");
        const response = await request(
          api + "?name=" + encodeURIComponent(file.name),
          { method: "POST", body: file },
        );
        const photo = await response.json();
        setPhotos((previous) => [photo, ...previous]);
      } catch (err) {
        failures.push(file.name + " — " + (err as Error).message);
      }
    }
    setError(failures.join(" "));
    setBusy("");
  }
  function openPhoto(photo: Photo) {
    select(photo);
    setQuestion("");
    pendingTurn.current = { key: "", id: "" };
    setNote(photo.note);
    setError("");
    setConfirmRemove(false);
  }
  async function updatePhoto(remove: boolean) {
    if (!selection) return;
    setBusy(remove ? "Removing…" : "Saving…");
    setError("");
    try {
      const response = await request(
        api + "/" + selection.id,
        remove
          ? { method: "DELETE" }
          : {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ note }),
            },
      );
      if (remove) {
        setPhotos((previous) =>
          previous.filter((photo) => photo.id !== selection.id),
        );
        select(null);
      } else {
        const updated = { ...selection, ...(await response.json()) };
        setPhotos((previous) =>
          previous.map((photo) => (photo.id === updated.id ? updated : photo)),
        );
        openPhoto(updated);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function askCharacter() {
    if (!worker || !selection || busy || !question.trim()) return;
    setBusy("Sending photo…");
    setError("");
    const key = JSON.stringify([
      selection.id,
      worker.id,
      worker.threadId,
      question.trim(),
    ]);
    if (pendingTurn.current.key !== key)
      pendingTurn.current = { key, id: crypto.randomUUID() };
    const sendId = pendingTurn.current.id;
    try {
      await request("/api/chat/photo-turns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: worker.id,
          threadId: worker.threadId,
          photoId: selection.id,
          question,
          sendId,
        }),
      });
      desk.select(worker.id);
      desk.dispatch(worker.id, { id: sendId, at: Date.now(), web: false });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <dialog
      ref={dialog}
      className="photo-gallery"
      aria-labelledby="gallery-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <PanelPaper>
        <div className="gallery-bar">
          <h2 id="gallery-title">Photo gallery</h2>
          <button aria-label="Close photo gallery" onClick={onClose}>
            ×
          </button>
        </div>
        {error && (
          <p role="alert" className="gallery-error">
            {error}
          </p>
        )}
        {busy && <p role="status">{busy}</p>}
        {selection ? (
          <>
            <button
              className="gallery-back"
              onClick={() => {
                select(null);
                filter("");
              }}
              disabled={!!busy}
            >
              ← All photos
            </button>
            <figure className="gallery-print">
              <img
                src={image(selection)}
                alt={selection.note || selection.name}
              />
              <figcaption>{selection.name}</figcaption>
            </figure>
            <label className="gallery-note">
              Photo note
              <DrawablyTextarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={2000}
                placeholder="Where were you? What would you like to remember?"
              />
            </label>
            <div className="gallery-actions">
              <DrawablyButton
                variant="solid"
                disabled={!!busy || selection.note === note.trim()}
                onClick={() => void updatePhoto(false)}
              >
                Save note
              </DrawablyButton>
              {confirmRemove ? (
                <>
                  <span>Remove this photo?</span>
                  <button
                    disabled={!!busy}
                    onClick={() => void updatePhoto(true)}
                  >
                    Remove
                  </button>
                  <button onClick={() => setConfirmRemove(false)}>Keep</button>
                </>
              ) : (
                <button
                  disabled={!!busy}
                  onClick={() => setConfirmRemove(true)}
                >
                  Remove photo
                </button>
              )}
            </div>
            <details className="gallery-ask" key={selection.id}>
              <summary>Ask a character about this photo</summary>
              {worker ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void askCharacter();
                  }}
                >
                  <label>
                    Character{" "}
                    <DrawablySelect
                      value={worker.id}
                      onChange={(event) => setRecipient(event.target.value)}
                    >
                      {desk.bots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name}
                        </option>
                      ))}
                    </DrawablySelect>
                  </label>
                  <label className="gallery-note">
                    Question
                    <DrawablyTextarea
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      maxLength={4000}
                      placeholder="What should I remember from this picture?"
                    />
                  </label>
                  <p>
                    Sending shares this image and question with {worker.name} in
                    OpenMausBot and its configured model.
                  </p>
                  <DrawablyButton
                    variant="solid"
                    disabled={!question.trim() || !!busy}
                    type="submit"
                  >
                    Send photo to {worker.name}
                  </DrawablyButton>
                </form>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    desk.enter();
                  }}
                >
                  Open character setup
                </button>
              )}
            </details>
          </>
        ) : (
          <>
            <div className="gallery-actions">
              <DrawablyButton
                variant="solid"
                disabled={!!busy}
                onClick={() => input.current?.click()}
              >
                ＋ Add photos
              </DrawablyButton>
              <span>JPEG, PNG, WebP · 12 MB each</span>
            </div>
            <input
              type="file"
              ref={input}
              hidden
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                void importPhotos(files);
              }}
            />
            {collections.length > 0 && (
              <div className="gallery-suggestions">
                <p>Suggested albums by filename, note and date added</p>
                <div>
                  <button aria-pressed={!group} onClick={() => filter("")}>
                    All ({photos.length})
                  </button>
                  {collections.map((group) => (
                    <button
                      key={group.title}
                      aria-pressed={collection === group.title}
                      onClick={() => filter(group.title)}
                    >
                      {group.title} ({group.photos.length})
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!busy && !photos.length && !error && (
              <div className="gallery-empty">
                <h3>Your first photograph</h3>
                <p>
                  Add a picture and give it a note to start your island album.
                </p>
              </div>
            )}
            <div className="gallery-grid">
              {visible.map((photo) => (
                <button key={photo.id} onClick={() => openPhoto(photo)}>
                  <img
                    loading="lazy"
                    src={image(photo)}
                    alt={photo.note || photo.name}
                  />
                  <span>{photo.name}</span>
                </button>
              ))}
            </div>
            <p className="gallery-local">
              Photos are saved on this device. You choose which photos to share
              with a character.
            </p>
          </>
        )}
      </PanelPaper>
    </dialog>
  );
}
