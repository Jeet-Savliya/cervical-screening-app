import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

const RISK_FILTERS = ["All", "Low", "Medium", "High"];

export default function DoctorDashboard() {
  const [patients, setPatients] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await api.get("/api/patients");
      setPatients(data);

      const reviewEntries = await Promise.all(
        data.map(async (p) => {
          try {
            const { data: review } = await api.get(`/api/patients/${p.id}/review`);
            return [p.id, review];
          } catch {
            return [p.id, null];
          }
        })
      );
      setReviews(Object.fromEntries(reviewEntries));
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete(e, patient) {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete the case for ${patient.name}? This permanently removes their intake data, ` +
        `uploaded photos, and review. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/patients/${patient.id}`);
      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
    } catch (err) {
      alert("Failed to delete case. Please try again.");
    }
  }

  async function handleBackup() {
    setBackingUp(true);
    try {
      const response = await api.get("/api/admin/backup", { responseType: "blob" });
      const disposition = response.headers["content-disposition"] || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : "cervical_screening_backup.zip";

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download backup. Please try again.");
    } finally {
      setBackingUp(false);
    }
  }

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      const review = reviews[p.id];
      const matchesRisk = riskFilter === "All" || review?.risk_level === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [patients, reviews, searchQuery, riskFilter]);

  const stats = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Unreviewed: 0 };
    const now = new Date();
    let thisMonth = 0;

    patients.forEach((p) => {
      const level = reviews[p.id]?.risk_level;
      if (level === "Low" || level === "Medium" || level === "High") {
        counts[level] += 1;
      } else {
        counts.Unreviewed += 1;
      }
      const created = new Date(p.created_at);
      if (created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) {
        thisMonth += 1;
      }
    });

    return { total: patients.length, thisMonth, counts };
  }, [patients, reviews]);

  if (loading) return <div className="card">Loading cases...</div>;

  return (
    <div>
      <div className="card stats-card">
        <div className="section-title">Overview</div>
        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total patients</div>
          </div>
          <div className="stat-tile">
            <div className="stat-number">{stats.thisMonth}</div>
            <div className="stat-label">This month</div>
          </div>
          <div
            className="stat-tile stat-tile-clickable"
            onClick={() => setRiskFilter("Low")}
          >
            <div className="stat-number stat-low">{stats.counts.Low}</div>
            <div className="stat-label">Low risk</div>
          </div>
          <div
            className="stat-tile stat-tile-clickable"
            onClick={() => setRiskFilter("Medium")}
          >
            <div className="stat-number stat-medium">{stats.counts.Medium}</div>
            <div className="stat-label">Medium risk</div>
          </div>
          <div
            className="stat-tile stat-tile-clickable"
            onClick={() => setRiskFilter("High")}
          >
            <div className="stat-number stat-high">{stats.counts.High}</div>
            <div className="stat-label">High risk</div>
          </div>
        </div>

        {stats.total > 0 && (
          <div className="risk-distribution-bar">
            {stats.counts.Low > 0 && (
              <div
                className="risk-bar-segment risk-bar-low"
                style={{ width: `${(stats.counts.Low / stats.total) * 100}%` }}
                title={`Low risk: ${stats.counts.Low}`}
              />
            )}
            {stats.counts.Medium > 0 && (
              <div
                className="risk-bar-segment risk-bar-medium"
                style={{ width: `${(stats.counts.Medium / stats.total) * 100}%` }}
                title={`Medium risk: ${stats.counts.Medium}`}
              />
            )}
            {stats.counts.High > 0 && (
              <div
                className="risk-bar-segment risk-bar-high"
                style={{ width: `${(stats.counts.High / stats.total) * 100}%` }}
                title={`High risk: ${stats.counts.High}`}
              />
            )}
            {stats.counts.Unreviewed > 0 && (
              <div
                className="risk-bar-segment risk-bar-unreviewed"
                style={{ width: `${(stats.counts.Unreviewed / stats.total) * 100}%` }}
                title={`Not yet reviewed: ${stats.counts.Unreviewed}`}
              />
            )}
          </div>
        )}
      </div>

      <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>
          Patient cases
        </div>
        <button className="secondary" onClick={handleBackup} disabled={backingUp}>
          {backingUp ? "Preparing backup..." : "Download backup"}
        </button>
      </div>

      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="risk-filter-tabs">
          {RISK_FILTERS.map((level) => (
            <button
              key={level}
              className={riskFilter === level ? "active" : ""}
              onClick={() => setRiskFilter(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {patients.length === 0 && <p>No patients yet. Submit an intake form to get started.</p>}
      {patients.length > 0 && filteredPatients.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13.5 }}>No cases match your search/filter.</p>
      )}
      {filteredPatients.map((p) => {
        const review = reviews[p.id];
        return (
          <Link key={p.id} to={`/patients/${p.id}`} className="patient-list-item">
            <span>
              {p.name} &middot; age {p.age}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {review?.risk_level && (
                <span className={`risk-badge risk-${review.risk_level}`}>{review.risk_level} risk</span>
              )}
              <button
                type="button"
                className="delete-btn"
                onClick={(e) => handleDelete(e, p)}
                title={`Delete case for ${p.name}`}
              >
                Delete
              </button>
            </span>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
