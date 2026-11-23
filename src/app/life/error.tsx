"use client";

/** If a Life Quest screen ever breaks, say so kindly and offer a retry instead of a blank error. */
export default function LifeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="lq-card mt-10 space-y-3 p-5 text-center">
      <p className="font-lq text-lg font-bold">หน้านี้มีปัญหานิดหน่อย</p>
      <p className="text-sm text-[#5e5878]">ข้อมูลไม่หาย ลองโหลดใหม่อีกครั้งนะ</p>
      <button className="lq-btn lq-btn-primary w-full" onClick={() => reset()}>
        ลองใหม่
      </button>
    </div>
  );
}
