:root {
  color-scheme: light;
  --bg: #eef4f5;
  --surface: #ffffff;
  --surface-soft: #f7fbfb;
  --text: #12252b;
  --muted: #667a82;
  --line: #d8e4e7;
  --primary: #0f5666;
  --primary-2: #16758a;
  --primary-soft: #dff0f3;
  --aqua: #0f7f8f;
  --aqua-soft: #e2f5f7;
  --accent: #f0b84f;
  --accent-soft: #fff2d4;
  --success: #2f8f6b;
  --success-soft: #e4f5ee;
  --warning: #bc7a2a;
  --warning-soft: #fff2df;
  --danger: #b64f63;
  --danger-soft: #fdecef;
  --shadow: 0 18px 44px rgba(18, 37, 43, 0.08);
  font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(22, 117, 138, 0.14), transparent 34rem),
    linear-gradient(180deg, #f8fbfb 0%, var(--bg) 36rem);
  color: var(--text);
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  border: 0;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}

button:hover {
  background: #0b4350;
}

button.ghost {
  background: var(--primary-soft);
  color: var(--primary);
}

button:disabled {
  cursor: wait;
  opacity: 0.68;
}

textarea,
input,
select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 11px 12px;
  background: white;
  color: var(--text);
  outline: none;
}

textarea:focus,
input:focus,
select:focus {
  border-color: var(--primary-2);
  box-shadow: 0 0 0 3px rgba(22, 117, 138, 0.12);
}

label {
  display: grid;
  gap: 7px;
  color: var(--muted);
  font-size: 14px;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: 24px;
  letter-spacing: 0;
}

h2 {
  margin-bottom: 0;
  font-size: 18px;
}

h3 {
  margin-bottom: 10px;
  font-size: 15px;
}

.app-shell {
  min-height: 100vh;
}

.auth-gate {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  background:
    linear-gradient(135deg, rgba(15, 86, 102, 0.86), rgba(47, 143, 107, 0.78)),
    var(--bg);
}

.auth-gate[hidden] {
  display: none;
}

.auth-card {
  display: grid;
  gap: 13px;
  width: min(100%, 460px);
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  padding: 26px;
  box-shadow: 0 30px 80px rgba(18, 37, 43, 0.24);
}

.auth-card .brand-mark {
  position: static;
}

.auth-card h2 {
  margin-bottom: 0;
  font-size: 25px;
}

.field-hint {
  margin: -4px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.auth-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  border-radius: 10px;
  background: #e7f1f3;
  padding: 4px;
}

.auth-tabs .segmented {
  padding: 9px 8px;
}

.role-choice {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 4px;
  border-radius: 10px;
  background: #e7f1f3;
}

.auth-form {
  display: grid;
  gap: 12px;
}

.auth-form[hidden] {
  display: none;
}

.form-message {
  min-height: 20px;
  margin: 0;
  color: var(--danger);
  font-size: 13px;
}

.command-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 16px 22px;
  border-bottom: 1px solid rgba(216, 228, 231, 0.9);
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 13px;
}

.brand-mark {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 12px;
  background: var(--primary);
  color: white;
  font-weight: 900;
}

.brand-mark::after {
  content: "";
  position: absolute;
}

.eyebrow {
  margin-bottom: 4px;
  color: var(--primary-2);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.muted {
  color: var(--muted);
  font-size: 14px;
}

.command-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
}

.role-switch {
  display: flex;
  padding: 4px;
  border-radius: 10px;
  background: #e7f1f3;
}

.segmented {
  background: transparent;
  color: var(--primary);
}

.segmented.active {
  background: white;
  color: var(--primary);
  box-shadow: 0 4px 14px rgba(15, 86, 102, 0.14);
}

.segmented.locked,
.segmented:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px 6px 6px;
  border: 1px solid #d7e7eb;
  border-radius: 999px;
  background: #fff;
  color: var(--text);
}

.user-profile[hidden] {
  display: none;
}

.user-avatar {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #2fbf71);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.user-profile strong,
.user-profile small {
  display: block;
  line-height: 1.25;
}

.user-profile small {
  color: var(--muted);
  font-size: 12px;
}

.dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(4, 124px);
  gap: 12px;
  padding: 16px 22px 6px;
}

.hero-card,
.stat-card,
.panel {
  border: 1px solid rgba(216, 228, 231, 0.9);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow);
}

.hero-card {
  min-height: 116px;
  padding: 18px;
  background:
    linear-gradient(135deg, rgba(15, 86, 102, 0.92), rgba(22, 117, 138, 0.76)),
    linear-gradient(135deg, #dff0f3, white);
  color: white;
}

.hero-card .eyebrow,
.hero-card .hero-copy {
  color: rgba(255, 255, 255, 0.86);
}

.hero-card h2 {
  margin-bottom: 10px;
  font-size: 25px;
}

.hero-copy {
  max-width: 780px;
  margin-bottom: 0;
}

.stat-card {
  display: grid;
  align-content: center;
  justify-items: start;
  min-height: 116px;
  padding: 16px;
}

.stat-card span {
  color: var(--primary);
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
}

.stat-card small {
  margin-top: 10px;
  color: var(--muted);
}

.primary-stat {
  background: #fffaf0;
}

.primary-stat span {
  color: var(--warning);
}

.risk-stat span {
  font-size: 23px;
  color: var(--danger);
}

.stat-card[data-tone="success"] {
  background: var(--success-soft);
}

.stat-card[data-tone="success"] span {
  color: var(--success);
}

.stat-card[data-tone="warning"] {
  background: var(--warning-soft);
}

.stat-card[data-tone="warning"] span {
  color: var(--warning);
}

.stat-card[data-tone="danger"] {
  background: var(--danger-soft);
}

.stat-card[data-tone="danger"] span {
  color: var(--danger);
}

.layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 340px;
  gap: 14px;
  padding: 12px 22px 24px;
}

.left-rail,
.assistant,
.workbench {
  display: grid;
  align-content: start;
  gap: 16px;
  min-width: 0;
}

.panel {
  padding: 15px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.status-chip,
.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 5px 9px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-chip[data-tone="aqua"] {
  background: var(--aqua-soft);
  color: var(--aqua);
}

.status-chip[data-tone="amber"] {
  background: var(--accent-soft);
  color: var(--warning);
}

.status-chip[data-tone="green"] {
  background: var(--success-soft);
  color: var(--success);
}

.inline-controls {
  display: grid;
  grid-template-columns: 1fr 72px;
  gap: 8px;
  align-items: end;
  margin-top: 10px;
}

.inline-controls button {
  grid-column: 1 / -1;
}

.stage-timeline,
.group-list,
.compact-list,
.advice-list {
  display: grid;
  gap: 10px;
}

.stage-button {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text);
  text-align: left;
}

.stage-button.active {
  border-color: var(--primary-2);
  background: #edf8fa;
}

.stage-dot {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  background: white;
  color: var(--primary);
  font-weight: 900;
  box-shadow: inset 0 0 0 1px rgba(15, 86, 102, 0.12);
}

.stage-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.stage-copy small,
.group-button small {
  color: var(--muted);
  line-height: 1.35;
}

.stage-percent,
.group-progress {
  color: var(--primary);
  font-weight: 900;
}

.group-button {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text);
  text-align: left;
}

.group-button.active {
  border-color: var(--primary-2);
  background: #edf8fa;
}

.group-button span:first-child {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.form-grid,
.method-grid,
.toolkit-grid,
.visual-grid {
  display: grid;
  gap: 14px;
}

.form-grid,
.method-grid,
.toolkit-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.toolkit-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.tool-card {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
  padding: 14px;
}

.tool-card h3 {
  margin-bottom: 5px;
}

.tool-card p {
  margin-bottom: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
}

.tool-symbol {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 14px;
  background: var(--primary);
  color: white;
  font-weight: 900;
}

.tool-card[data-tone="aqua"] .tool-symbol {
  background: var(--aqua);
}

.tool-card[data-tone="amber"] .tool-symbol {
  background: var(--warning);
}

.tool-card[data-tone="green"] .tool-symbol {
  background: var(--success);
}

.visual-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.evidence-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.evidence-item,
.list-item,
.visual-card,
.advice-section {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.evidence-item,
.list-item {
  display: grid;
  gap: 10px;
  padding: 12px;
}

.card-meta,
.list-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-meta small {
  color: var(--muted);
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.metric-row.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mini-bar {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 44px;
  gap: 8px;
  align-items: center;
  color: var(--muted);
  font-size: 13px;
}

.mini-bar b {
  color: var(--primary);
  text-align: right;
}

.visual-card {
  min-height: 188px;
  padding: 14px;
}

.radar-card {
  display: grid;
  align-content: start;
}

.radar-wrap {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  align-items: center;
  justify-items: center;
}

.radar-svg {
  width: 132px;
  height: 132px;
}

.radar-svg circle,
.radar-svg line {
  fill: none;
  stroke: #cfdee2;
  stroke-width: 1;
}

.radar-svg polygon {
  fill: rgba(22, 117, 138, 0.24);
  stroke: var(--primary);
  stroke-width: 3;
}

.radar-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}

.radar-metric {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 5px;
  color: var(--muted);
  font-size: 12px;
}

.radar-metric b {
  color: var(--primary);
}

.bar-row {
  margin-bottom: 11px;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 13px;
}

.bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #dfe9ec;
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary), var(--primary-2));
}

.word-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.word-cloud span {
  border-radius: 999px;
  padding: 6px 10px;
  background: white;
  color: var(--primary);
  box-shadow: 0 4px 12px rgba(18, 37, 43, 0.06);
}

.assistant .sticky-panel {
  position: sticky;
  top: 86px;
}

.advice-section {
  padding: 12px;
}

.advice-section h3 {
  color: var(--primary);
}

.advice-item {
  padding: 10px 0;
  border-top: 1px solid var(--line);
  color: var(--text);
  line-height: 1.55;
}

.model-box {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.compact-title {
  margin-bottom: 10px;
}

.ai-panel {
  display: grid;
  gap: 10px;
}

.model-config-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 10px;
}

.model-result {
  min-height: 92px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 12px;
  color: var(--text);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.assistant .advice-list {
  max-height: 42vh;
  overflow: auto;
  padding-right: 2px;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.model-grid span {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px;
  background: white;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
}

.empty-state {
  grid-column: 1 / -1;
  border: 1px dashed var(--line);
  border-radius: 8px;
  padding: 24px;
  background: var(--surface-soft);
  color: var(--muted);
  text-align: center;
}

.student-mode .teacher-only {
  display: none;
}

@media (max-width: 1220px) {
  .dashboard {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .hero-card {
    grid-column: 1 / -1;
  }

  .layout {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .visual-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .assistant {
    grid-column: 1 / -1;
  }

  .assistant .sticky-panel {
    position: static;
  }
}

@media (max-width: 860px) {
  .command-bar,
  .brand-block,
  .panel-title {
    align-items: stretch;
  }

  .command-bar {
    flex-direction: column;
  }

  .dashboard,
  .layout,
  .form-grid,
  .method-grid,
  .toolkit-grid,
  .model-config-grid,
  .visual-grid,
  .evidence-grid {
    grid-template-columns: 1fr;
  }

  .radar-wrap {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .metric-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
