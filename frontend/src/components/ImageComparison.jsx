import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

const CATEGORIES = [
  {
    value: "via_negative",
    label: "VIA negative",
    criteria:
      "No acetowhite change, or only thin/indistinct patches that blend into the surrounding tissue with no clear margin — typically a normal finding.",
  },
  {
    value: "via_positive",
    label: "VIA positive",
    criteria:
      "Dense, opaque acetowhite areas with well-defined margins near the transformation zone, persisting beyond about a minute.",
  },
  {
    value: "suspicious_cancer",
    label: "Suspicious of cancer",
    criteria:
      "Thick, irregular acetowhite areas, visible growth, contact bleeding, ulceration, or necrosis — warrants urgent referral regardless of other findings.",
  },
];

export default function ImageComparison({ patientImages, selectedFinding, onSelectFinding }) {
  const [category, setCategory] = useState("via_negative");
  const [referenceImages, setReferenceImages] = useState([]);
  const [activePatientIdx, setActivePatientIdx] = useState(0);
  const [activeReferenceId, setActiveReferenceId] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [viewMode, setViewMode] = useState("side"); // "side" | "flip"
  const [flipShowing, setFlipShowing] = useState("patient"); // "patient" | "reference"

  const activeThumbRef = useRef(null);

  useEffect(() => {
    api.get("/api/reference-images", { params: { via_category: category } }).then(({ data }) => {
      setReferenceImages(data);
      setActiveReferenceId(data.length > 0 ? data[0].id : null);
    });
  }, [category]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeReferenceId]);

  const activeCategory = CATEGORIES.find((c) => c.value === category);
  const activeReference = referenceImages.find((img) => img.id === activeReferenceId) || null;

  function pickReference(img) {
    setActiveReferenceId(img.id);
    onSelectFinding(img.subtype_label || img.via_category);
  }

  function moveActiveReference(delta) {
    if (referenceImages.length === 0) return;
    const idx = referenceImages.findIndex((img) => img.id === activeReferenceId);
    const nextIdx = idx === -1 ? 0 : (idx + delta + referenceImages.length) % referenceImages.length;
    pickReference(referenceImages[nextIdx]);
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setLightboxSrc(null);
        return;
      }
      // Don't hijack arrow keys / letters while the doctor is typing elsewhere on the page
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveActiveReference(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveActiveReference(-1);
      } else if (e.key.toLowerCase() === "f" && viewMode === "flip") {
        setFlipShowing((prev) => (prev === "patient" ? "reference" : "patient"));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [referenceImages, activeReferenceId, viewMode]);

  const patientSrc =
    patientImages.length > 0 ? patientImages[activePatientIdx].url : null;
  const referenceSrc = activeReference ? activeReference.url : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="section-title" style={{ margin: 0 }}>
          Compare
        </div>
        <div className="view-mode-toggle">
          <button className={viewMode === "side" ? "active" : ""} onClick={() => setViewMode("side")}>
            Side-by-side
          </button>
          <button
            className={viewMode === "flip" ? "active" : ""}
            onClick={() => {
              setViewMode("flip");
              setFlipShowing("patient");
            }}
          >
            Flip view
          </button>
        </div>
      </div>

      {viewMode === "side" ? (
        <div className="comparison-grid">
          <div>
            <div className="section-title">Patient photo</div>
            {patientImages.length === 0 && <p>No photo uploaded for this patient.</p>}
            {patientSrc && (
              <div className="patient-image-preview">
                <img src={patientSrc} alt="Patient" onClick={() => setLightboxSrc(patientSrc)} style={{ cursor: "zoom-in" }} />
                {patientImages.length > 1 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {patientImages.map((img, idx) => (
                      <button
                        key={img.id}
                        className={idx === activePatientIdx ? "" : "secondary"}
                        onClick={() => setActivePatientIdx(idx)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="section-title">Reference match</div>
            <div className="patient-image-preview">
              {referenceSrc ? (
                <img
                  src={referenceSrc}
                  alt={activeReference.subtype_label || activeReference.via_category}
                  onClick={() => setLightboxSrc(referenceSrc)}
                  style={{ cursor: "zoom-in" }}
                />
              ) : (
                <div className="reference-empty-panel">No reference images in this category yet.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flip-frame">
            {flipShowing === "patient" ? (
              patientSrc ? (
                <img src={patientSrc} alt="Patient" onClick={() => setLightboxSrc(patientSrc)} />
              ) : (
                <div className="reference-empty-panel">No patient photo uploaded.</div>
              )
            ) : referenceSrc ? (
              <img src={referenceSrc} alt="Reference" onClick={() => setLightboxSrc(referenceSrc)} />
            ) : (
              <div className="reference-empty-panel">No reference images in this category yet.</div>
            )}
            <span className="flip-frame-label">{flipShowing === "patient" ? "Patient" : "Reference"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <button
              className="secondary"
              onClick={() => setFlipShowing((prev) => (prev === "patient" ? "reference" : "patient"))}
            >
              Flip to {flipShowing === "patient" ? "reference" : "patient"} (F)
            </button>
          </div>
        </div>
      )}

      {/* Category tabs + criteria text, grounding the comparison in what to look for */}
      <div className="category-tabs" style={{ marginTop: 22 }}>
        {CATEGORIES.map((c) => (
          <button key={c.value} className={category === c.value ? "active" : ""} onClick={() => setCategory(c.value)}>
            {c.label}
          </button>
        ))}
      </div>
      {activeCategory && <p className="criteria-text">{activeCategory.criteria}</p>}

      {/* Filmstrip: browse candidates without losing the large comparison above */}
      <div className="reference-filmstrip">
        {referenceImages.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Upload reference images for this category in the Reference library.</p>
        )}
        {referenceImages.map((img) => (
          <div
            key={img.id}
            ref={activeReferenceId === img.id ? activeThumbRef : null}
            className={`filmstrip-thumb ${activeReferenceId === img.id ? "active" : ""} ${
              selectedFinding === img.subtype_label || selectedFinding === img.via_category ? "selected" : ""
            }`}
            onClick={() => pickReference(img)}
            title={img.subtype_label || img.via_category}
          >
            <img src={img.url} alt={img.subtype_label || img.via_category} />
          </div>
        ))}
      </div>
      <p className="keyboard-hint">
        Use ← → to browse reference images{viewMode === "flip" ? ", F to flip" : ""}.
      </p>
      {selectedFinding && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
          Selected finding: <strong style={{ color: "var(--ink)" }}>{selectedFinding}</strong>
        </p>
      )}

      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <button type="button" className="lightbox-close" onClick={() => setLightboxSrc(null)} aria-label="Close">
            Close ✕
          </button>
          <img src={lightboxSrc} alt="Enlarged view" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
