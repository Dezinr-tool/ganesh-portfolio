(() => {
  // Injected fresh on every pen-button click — clean up any stray overlay
  // left behind by a previous injection before creating a new one.
  const existing = document.getElementById("__vn-pen-overlay-root");
  if (existing) existing.remove();

  const MIN_SIZE = 10;
  const PADDING = 12;

  const root = document.createElement("div");
  root.id = "__vn-pen-overlay-root";
  root.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "cursor:crosshair",
    "background:rgba(10,132,255,0.04)",
  ].join(";");

  const badge = document.createElement("div");
  badge.textContent = "Draw around something, then release. Esc to cancel.";
  badge.style.cssText = [
    "position:fixed",
    "top:12px",
    "left:50%",
    "transform:translateX(-50%)",
    "background:#121212",
    "color:#f2f2f2",
    "font:13px -apple-system,Segoe UI,Arial,sans-serif",
    "padding:6px 12px",
    "border-radius:999px",
    "box-shadow:0 2px 10px rgba(0,0,0,0.3)",
    "pointer-events:none",
  ].join(";");

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;";
  const ctx = canvas.getContext("2d");

  root.appendChild(canvas);
  root.appendChild(badge);
  document.documentElement.appendChild(root);

  let drawing = false;
  let points = [];

  function drawStroke() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (points.length < 2) return;
    ctx.strokeStyle = "#ff453a";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }

  function cleanup() {
    canvas.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("keydown", onKeyDown);
    root.remove();
  }

  function onMouseDown(e) {
    drawing = true;
    points = [{ x: e.clientX, y: e.clientY }];
  }

  function onMouseMove(e) {
    if (!drawing) return;
    points.push({ x: e.clientX, y: e.clientY });
    drawStroke();
  }

  function onMouseUp() {
    if (!drawing) return;
    drawing = false;

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.max(0, Math.min(...xs) - PADDING);
    const minY = Math.max(0, Math.min(...ys) - PADDING);
    const maxX = Math.min(window.innerWidth, Math.max(...xs) + PADDING);
    const maxY = Math.min(window.innerHeight, Math.max(...ys) + PADDING);
    const rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

    cleanup();

    if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) return;

    chrome.runtime.sendMessage({
      type: "vn-capture-request",
      rect,
      dpr: window.devicePixelRatio || 1,
    });
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      cleanup();
      chrome.runtime.sendMessage({ type: "vn-pen-cancelled" });
    }
  }

  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("keydown", onKeyDown);
})();
