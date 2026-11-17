"use client";

import { useEffect, useRef, useState } from "react";

type Decode = (data: Uint8ClampedArray, w: number, h: number) => { data: string } | null;
const loadJsQR = () => import("jsqr").then((m) => m.default as unknown as Decode);

/** Reads a QR code from a canvas-drawable source, trying a smaller copy too (big photos read badly). */
function readFrom(src: CanvasImageSource, w: number, h: number, jsQR: Decode): string | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  for (const scale of [1, 1000 / Math.max(w, h)]) {
    if (scale > 1) continue;
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    const hit = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
    if (hit) return hit.data;
  }
  return null;
}

/** Live camera scan; calls onCode with the first QR it reads. */
function Camera({ onCode, onError }: { onCode: (text: string) => void; onError: (msg: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  // The latest callbacks, without restarting the camera when the parent re-renders.
  const cb = useRef({ onCode, onError });
  useEffect(() => {
    cb.current = { onCode, onError };
  });
  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let live = true;
    (async () => {
      try {
        const [jsQR, s] = await Promise.all([
          loadJsQR(),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }),
        ]);
        stream = s;
        if (!live || !video.current) return s.getTracks().forEach((t) => t.stop());
        video.current.srcObject = s;
        await video.current.play();
        const tick = () => {
          const v = video.current;
          if (!live || !v) return;
          const hit = v.videoWidth ? readFrom(v, v.videoWidth, v.videoHeight, jsQR) : null;
          if (hit) cb.current.onCode(hit);
          else timer = window.setTimeout(tick, 250);
        };
        tick();
      } catch {
        if (live) cb.current.onError("เปิดกล้องไม่ได้ — อนุญาตให้ใช้กล้อง หรือใช้ 'เลือกรูป QR' แทน");
      }
    })();
    return () => {
      live = false;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  return <video ref={video} muted playsInline className="mt-3 aspect-square w-full rounded-xl border-2 border-ink bg-ink object-cover" />;
}

/**
 * Get a QR code's text: scan it with the camera (shown on the player's phone), or pick a photo or
 * screenshot of it (sent in LINE — a phone can't point its camera at its own screen).
 */
export function QrScan({ onCode }: { onCode: (text: string) => void }) {
  const [camera, setCamera] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const fromCamera = (text: string) => {
    setCamera(false);
    onCode(text);
  };
  const fromImage = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    try {
      const [jsQR, bmp] = await Promise.all([loadJsQR(), createImageBitmap(f)]);
      const hit = readFrom(bmp, bmp.width, bmp.height, jsQR);
      if (hit) onCode(hit);
      else setErr("ไม่เจอ QR ในรูปนี้ ลองครอปให้เห็น QR ชัดๆ");
    } catch {
      setErr("เปิดรูปนี้ไม่ได้");
    } finally {
      if (file.current) file.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          className={`btn flex-1 text-sm ${camera ? "btn-gold" : "btn-ghost"}`}
          onClick={() => {
            setErr(null);
            setCamera(!camera);
          }}
        >
          {camera ? "✕ ปิดกล้อง" : "📷 สแกน QR"}
        </button>
        <button className="btn btn-ghost flex-1 text-sm" onClick={() => file.current?.click()}>
          🖼️ เลือกรูป QR
        </button>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => fromImage(e.target.files?.[0])} />
      </div>
      {camera && <Camera onCode={fromCamera} onError={(m) => (setCamera(false), setErr(m))} />}
      {err && <p className="mt-2 text-sm text-bad">{err}</p>}
    </div>
  );
}
