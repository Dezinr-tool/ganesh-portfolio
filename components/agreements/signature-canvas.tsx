"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type SignatureCanvasRef = {
  getDataUrl: () => string | null;
  clear: () => void;
  hasContent: () => boolean;
};

type SignatureCanvasProps = {
  width?: number;
  height?: number;
  disabled?: boolean;
  showClearButton?: boolean;
  onChange?: (hasSignature: boolean) => void;
};

export const SignatureCanvas = forwardRef<
  SignatureCanvasRef,
  SignatureCanvasProps
>(function SignatureCanvas(
  {
    width = 500,
    height = 200,
    disabled = false,
    showClearButton = true,
    onChange,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasContentRef = useRef(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const markHasContent = useCallback(() => {
    if (!hasContentRef.current) {
      hasContentRef.current = true;
      onChange?.(true);
    }
  }, [onChange]);

  const clear = useCallback(() => {
    initCanvas();
    hasContentRef.current = false;
    onChange?.(false);
  }, [initCanvas, onChange]);

  useImperativeHandle(
    ref,
    () => ({
      getDataUrl: () => {
        if (!hasContentRef.current) return null;
        return canvasRef.current?.toDataURL("image/png") ?? null;
      },
      clear,
      hasContent: () => hasContentRef.current,
    }),
    [clear],
  );

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      drawing.current = true;
      const pos = getPos(e.clientX, e.clientY);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      const pos = getPos(e.clientX, e.clientY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      markHasContent();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      drawing.current = false;
      canvas.releasePointerCapture(e.pointerId);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [disabled, getPos, markHasContent]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height, maxWidth: "100%" }}
        className={`touch-none border border-neutral-300 bg-white ${disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"}`}
      />
      {showClearButton && !disabled ? (
        <button
          type="button"
          onClick={clear}
          className="mt-2 text-xs text-neutral-500 hover:text-neutral-800"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
});
