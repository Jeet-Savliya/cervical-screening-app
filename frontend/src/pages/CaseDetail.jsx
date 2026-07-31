import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import ImageComparison from "../components/ImageComparison.jsx";

export default function CaseDetail() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [review, setReview] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data: p } = await api.get(`/api/patients/${patientId}`);
    setPatient(p);
    try {
      const { data: r } = await api.get(`/api/patients/${patientId}/review`);
      setReview(r);
      setNotes(r.doctor_notes || "");
    } catch {
      setReview(null);
    }
  }

  useEffect(() => {
    load();
  }, [patientId]);

  async function handleAddPhotos(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/api/patients/${patientId}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await load();
    } catch (err) {
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSelectFinding(finding) {
    setSaving(true);
    const { data } = await api.put(`/api/patients/${patientId}/review`, {
      via_finding: finding,
      doctor_notes: notes,
    });
    setReview(data);
    setSaving(false);
  }

  async function handleSaveNotes() {
    setSaving(true);
    const { data } = await api.put(`/api/patients/${patientId}/review`, {
      doctor_notes: notes,
    });
    setReview(data);
    setSaving(false);
  }

  if (!patient) return <div className="card">Loading case...</div>;

  const rf = patient.risk_factor;

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="section-title" style={{ margin: 0 }}>
            {patient.name} &middot; age {patient.age}
          </div>
          <Link to={`/patients/${patientId}/summary`} className="secondary-link">
            Generate summary &rarr;
          </Link>
        </div>
        {review?.red_flag_symptoms?.length > 0 && (
          <div className="notice notice-danger">
            <b>Recommend clinical exam regardless of risk score.</b> Symptom(s) present:{" "}
            {review.red_flag_symptoms.join(", ")}.
          </div>
        )}
        {review?.risk_level && (
          <p>
            Background risk score: <b>{review.risk_score}</b> &nbsp;
            <span className={`risk-badge risk-${review.risk_level}`}>{review.risk_level} risk</span>
          </p>
        )}
        {review?.risk_factors_detail?.length > 0 && (
          <details style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
            <summary>What contributed to this score</summary>
            <ul>
              {review.risk_factors_detail.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </details>
        )}
        {review?.informational_flags?.length > 0 && (
          <details style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
            <summary>Other noted factors (not scored — no reliable published estimate)</summary>
            <ul>
              {review.informational_flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </details>
        )}
        {rf && (
          <ul style={{ fontSize: 13, color: "#475569", columns: 2 }}>
            <li>Residence: {rf.residence_type}</li>
            <li>Parity: {rf.parity}</li>
            <li>Multiple partners: {rf.multiple_partners ? "Yes" : "No"}</li>
            <li>Post-coital bleeding: {rf.post_coital_bleeding ? "Yes" : "No"}</li>
            <li>HIV positive: {rf.hiv_positive ? "Yes" : "No"}</li>
            <li>Smoking/tobacco: {rf.smoking_tobacco ? "Yes" : "No"}</li>
            <li>OCP years: {rf.ocp_years}</li>
            <li>Family history: {rf.family_history_cancer ? "Yes" : "No"}</li>
          </ul>
        )}
      </div>

      <div className="card">
        <div className="notice">
          Compare the patient's photo against the reference library, then select the closest
          matching finding. This selection is the doctor's clinical judgement, not an automated
          diagnosis.
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>
            {patient.images.length > 0 ? "Add another photo" : "Add referral photo"}
          </label>
          <input type="file" accept="image/*" multiple onChange={handleAddPhotos} disabled={uploading} />
          {uploading && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Uploading...</p>}
        </div>
        <ImageComparison
          patientImages={patient.images}
          selectedFinding={review?.via_finding}
          onSelectFinding={handleSelectFinding}
        />

        {review?.via_finding && (
          <p style={{ marginTop: 16 }}>
            Selected finding: <b>{review.via_finding}</b>
          </p>
        )}

        <div className="field" style={{ marginTop: 16 }}>
          <label>Doctor notes</label>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button onClick={handleSaveNotes} disabled={saving}>
          {saving ? "Saving..." : "Save notes"}
        </button>
      </div>
    </div>
  );
}
