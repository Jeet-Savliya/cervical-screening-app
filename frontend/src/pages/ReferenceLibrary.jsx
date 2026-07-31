import { useEffect, useState } from "react";
import { api } from "../api.js";

const CATEGORIES = [
  { value: "via_negative", label: "VIA negative" },
  { value: "via_positive", label: "VIA positive" },
  { value: "suspicious_cancer", label: "Suspicious of invasive cancer" },
];

export default function ReferenceLibrary() {
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState("via_negative");
  const [subtypeLabel, setSubtypeLabel] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data } = await api.get("/api/reference-images");
    setImages(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("via_category", category);
    fd.append("subtype_label", subtypeLabel);
    try {
      await api.post("/api/reference-images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setSubtypeLabel("");
      load();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(img) {
    const confirmed = window.confirm("Remove this reference image from the library?");
    if (!confirmed) return;

    try {
      await api.delete(`/api/reference-images/${img.id}`);
      setImages((prev) => prev.filter((i) => i.id !== img.id));
    } catch (err) {
      alert("Failed to delete reference image. Please try again.");
    }
  }

  return (
    <div className="card">
      <div className="notice">
        Build this library with your own de-identified case images. This is what powers the
        side-by-side comparison view on each patient's case.
      </div>
      <div className="section-title">Add a reference image</div>
      <form onSubmit={handleUpload}>
        <div className="field-row">
          <div className="field">
            <label>VIA category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Subtype / description (optional)</label>
            <input
              type="text"
              placeholder="e.g. Dense acetowhite, well-defined margins"
              value={subtypeLabel}
              onChange={(e) => setSubtypeLabel(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label>Image file</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <button type="submit" disabled={uploading || !file}>
          {uploading ? "Uploading..." : "Add to library"}
        </button>
      </form>

      <div className="section-title">Library ({images.length})</div>
      <div className="reference-grid">
        {images.map((img) => (
          <div key={img.id} className="reference-thumb">
            <button
              type="button"
              className="delete-btn thumb-delete-btn"
              onClick={() => handleDelete(img)}
              title="Remove this reference image"
            >
              Delete
            </button>
            <img src={img.url} alt={img.subtype_label || img.via_category} />
            <div className="label">
              {CATEGORIES.find((c) => c.value === img.via_category)?.label}
              {img.subtype_label ? ` — ${img.subtype_label}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
