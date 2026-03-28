import { createElement, useState } from 'react';
import jsPDF from 'jspdf';
import { useLocation, Link } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowLeft,
  Trophy,
  Target,
  AlertTriangle,
  TrendingUp,
  Clock,
  Repeat,
  CheckCircle2,
  XCircle,
  Shield,
  Lightbulb,
  ThumbsUp,
  Activity,
  BarChart3,
} from 'lucide-react';

const CHART_WIDTH = 760;
const CHART_HEIGHT = 250;

export default function ReportPage() {
  const location = useLocation();
  const report = location.state?.report;
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  if (!report) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-center px-6">
        <div className="glass-card p-12 max-w-md">
          <Trophy className="w-12 h-12 text-dark-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Report Found</h2>
          <p className="text-dark-300 text-sm mb-6">Complete a session to generate your workout report.</p>
          <Link to="/session" className="btn-primary inline-flex items-center gap-2 no-underline">
            Start a Session
          </Link>
        </div>
      </div>
    );
  }

  const insights = report.insights || {};
  const reps = report.perRepData || [];
  const grade = insights.overallGrade || 'C';

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  async function handleDownloadPdf() {
    if (isDownloadingPdf) {
      return;
    }

    try {
      setPdfError('');
      setIsDownloadingPdf(true);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      let y = 18;

      const addSectionTitle = (title) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(28, 24, 25);
        pdf.text(title, margin, y);
        y += 7;
      };

      const addBodyText = (text) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(70, 70, 70);
        const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
        pdf.text(lines, margin, y);
        y += (lines.length * 5) + 2;
      };

      const ensureSpace = (needed = 20) => {
        if (y + needed > pageHeight - 14) {
          pdf.addPage();
          y = 18;
        }
      };

      pdf.setFillColor(255, 123, 84);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 26, 4, 4, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text('FitMon Session Report', margin + 6, y + 11);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date(report.startedAt).toLocaleString()}`, margin + 6, y + 19);
      y += 36;

      addSectionTitle('Overview');
      addBodyText(insights.summary || `You completed ${report.totalReps} reps with ${report.accuracy}% accuracy.`);

      ensureSpace(30);
      const metrics = [
        ['Grade', grade],
        ['Total Reps', String(report.totalReps)],
        ['Accuracy', `${report.accuracy}%`],
        ['Duration', formatDuration(report.duration)],
        ['Posture', String(report.avgPostureScore)],
        ['Injury Risk', `${report.injuryRiskScore}%`],
      ];

      let metricX = margin;
      metrics.forEach(([label, value], index) => {
        pdf.setFillColor(247, 244, 241);
        pdf.roundedRect(metricX, y, 28, 20, 3, 3, 'F');
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(8);
        pdf.text(label, metricX + 3, y + 6);
        pdf.setTextColor(30, 30, 30);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(value, metricX + 3, y + 14);
        metricX += 31;
        if ((index + 1) % 3 === 0) {
          y += 24;
          metricX = margin;
        }
      });
      y += 6;

      ensureSpace(55);
      addSectionTitle('Rep Performance');
      drawPerformanceChart(pdf, reps, margin, y, pageWidth - margin * 2, 52);
      y += 60;

      ensureSpace(35);
      addSectionTitle('Risk Summary');
      addBodyText(`Injury risk score: ${report.injuryRiskScore}%. Incorrect reps: ${report.incorrectReps}. Ineffective reps: ${report.ineffectiveReps}.`);

      if (insights.improvements?.length) {
        ensureSpace(30);
        addSectionTitle('Improvements');
        insights.improvements.forEach((item) => addBodyText(`- ${item}`));
      }

      if (insights.warnings?.length || insights.injuryExplanation) {
        ensureSpace(30);
        addSectionTitle('Warnings');
        insights.warnings?.forEach((warning) => addBodyText(`- ${warning}`));
        if (insights.injuryExplanation) addBodyText(insights.injuryExplanation);
      }

      if (insights.positiveFeedback?.length) {
        ensureSpace(30);
        addSectionTitle('What Went Well');
        insights.positiveFeedback.forEach((item) => addBodyText(`- ${item}`));
      }

      if (reps.length) {
        ensureSpace(45);
        addSectionTitle('Rep History');
        drawRepTable(pdf, reps, margin, y, pageWidth - margin * 2);
      }

      pdf.save(`fitmon-report-${report.sessionId || 'session'}.pdf`);
    } catch (error) {
      setPdfError(error?.message || 'PDF generation failed in this browser session.');
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="report-hero animate-fade-in">
          <div className="flex items-start gap-4">
            <Link to="/session" className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors no-underline text-dark-200 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="report-kicker">Post-Session Intelligence</p>
              <h1 className="text-3xl md:text-4xl font-black text-white">Your curl report is ready</h1>
              <p className="text-sm text-dark-300 mt-2">
                {new Date(report.startedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <ArrowDownToLine className="w-4 h-4" />
            {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
        </div>

        {pdfError ? (
          <div className="camera-error relative top-auto left-auto right-auto mt-4">
            <div>
              <strong>PDF download issue</strong>
              <p>{pdfError}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-6 mt-8">
          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-6">
              <div className={`grade-badge grade-${grade} shrink-0`}>{grade}</div>
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Overall Performance</h2>
                <p className="text-sm text-dark-200 leading-relaxed">
                  {insights.summary || `You completed ${report.totalReps} reps with ${report.accuracy}% accuracy.`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <MetricCard icon={Repeat} label="Total Reps" value={report.totalReps} />
            <MetricCard icon={Target} label="Accuracy" value={`${report.accuracy}%`} color={report.accuracy >= 70 ? 'text-success' : 'text-warning'} />
            <MetricCard icon={Clock} label="Duration" value={formatDuration(report.duration)} />
            <MetricCard icon={TrendingUp} label="Posture Score" value={report.avgPostureScore} color={report.avgPostureScore >= 70 ? 'text-success' : 'text-warning'} />
          </div>

          <div className="grid lg:grid-cols-[1.55fr_0.95fr] gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-accent-primary" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rep Performance Graph</h3>
              </div>
              <RepPerformanceChart reps={reps} />
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-warning" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Injury Risk Trend</h3>
              </div>
              <RiskGauge riskScore={report.injuryRiskScore} />
              <div className="grid grid-cols-3 gap-3 mt-5">
                <MiniRiskMetric label="Correct" value={report.correctReps} tone="text-success" />
                <MiniRiskMetric label="Incorrect" value={report.incorrectReps} tone="text-danger" />
                <MiniRiskMetric label="Ineffective" value={report.ineffectiveReps} tone="text-warning" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <div className="glass-card p-6 flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
              <div>
                <p className="text-2xl font-bold text-white">{report.correctReps}</p>
                <p className="text-xs text-dark-300">Correct Reps</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <XCircle className="w-8 h-8 text-danger shrink-0" />
              <div>
                <p className="text-2xl font-bold text-white">{report.incorrectReps}</p>
                <p className="text-xs text-dark-300">Incorrect Reps</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <Shield className="w-8 h-8 text-warning shrink-0" />
              <div>
                <p className="text-2xl font-bold text-white">{report.injuryRiskScore}%</p>
                <p className="text-xs text-dark-300">Injury Risk</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {insights.improvements?.length ? (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Improvements</h3>
                </div>
                <ul className="flex flex-col gap-3">
                  {insights.improvements.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-dark-200">
                      <span className="text-warning font-bold mt-0.5">{'->'}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {insights.positiveFeedback?.length ? (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsUp className="w-5 h-5 text-success" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">What You Did Well</h3>
                </div>
                <ul className="flex flex-col gap-3">
                  {insights.positiveFeedback.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-dark-200">
                      <span className="text-success font-bold mt-0.5">OK</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {(insights.warnings?.length || insights.injuryExplanation) ? (
            <div className="glass-card p-6 border-danger/20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Caution</h3>
              </div>
              <div className="flex flex-col gap-2 text-sm text-dark-200">
                {insights.warnings?.map((warning) => <p key={warning}>Alert: {warning}</p>)}
                {insights.injuryExplanation ? <p>{insights.injuryExplanation}</p> : null}
              </div>
            </div>
          ) : null}

          {reps.length ? (
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Rep History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="text-left py-2 px-3 text-dark-300 font-medium">Rep</th>
                      <th className="text-left py-2 px-3 text-dark-300 font-medium">Form Score</th>
                      <th className="text-left py-2 px-3 text-dark-300 font-medium">FSR Score</th>
                      <th className="text-left py-2 px-3 text-dark-300 font-medium">Avg FSR</th>
                      <th className="text-left py-2 px-3 text-dark-300 font-medium">ROM</th>
                      <th className="text-left py-2 px-3 text-dark-300 font-medium">Fusion</th>
                      <th className="text-left py-2 px-3 text-dark-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reps.map((rep) => (
                      <tr key={rep.repNumber} className="border-b border-dark-700/50">
                        <td className="py-2 px-3 text-dark-100 font-medium">#{rep.repNumber}</td>
                        <td className="py-2 px-3">
                          <span className={`font-bold ${rep.formScore >= 60 ? 'text-success' : 'text-danger'}`}>{rep.formScore}</span>
                        </td>
                        <td className="py-2 px-3 text-dark-200">{rep.fsrScore ?? '-'}</td>
                        <td className="py-2 px-3 text-dark-200">{rep.avgFsr ?? '-'}</td>
                        <td className="py-2 px-3 text-dark-200">
                          {rep.minAngle !== null && rep.maxAngle !== null ? `${Math.round(rep.minAngle)}° - ${Math.round(rep.maxAngle)}°` : '-'}
                        </td>
                        <td className="py-2 px-3 text-dark-200">{rep.fusionScore ?? '-'}</td>
                        <td className="py-2 px-3">
                          {rep.correct ? (
                            <span className="text-success font-medium">Good</span>
                          ) : (
                            <span className="text-danger font-medium">Needs Work</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <div className="text-center mt-10 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <Link to="/session" className="btn-primary inline-flex items-center gap-2 no-underline">
            <Repeat className="w-4 h-4" />
            Start New Session
          </Link>
        </div>
      </div>
    </div>
  );
}

function RepPerformanceChart({ reps }) {
  if (!reps.length) {
    return <EmptyChartState message="Complete more reps to render a performance graph." />;
  }

  const maxScore = Math.max(100, ...reps.flatMap((rep) => [rep.formScore ?? 0, rep.fsrScore ?? 0, rep.fusionScore ?? 0]));
  const leftPadding = 28;
  const bottomPadding = 26;
  const topPadding = 20;
  const usableWidth = CHART_WIDTH - leftPadding - 20;
  const usableHeight = CHART_HEIGHT - topPadding - bottomPadding;
  const stepX = reps.length > 1 ? usableWidth / (reps.length - 1) : 0;

  const lineFromKey = (key) =>
    reps
      .map((rep, index) => {
        const value = rep[key] ?? 0;
        const x = leftPadding + (stepX * index);
        const y = topPadding + usableHeight - ((value / maxScore) * usableHeight);
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="report-chart-shell">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-auto">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = topPadding + usableHeight - ((tick / maxScore) * usableHeight);
          return (
            <g key={tick}>
              <line x1={leftPadding} x2={CHART_WIDTH - 12} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 8" />
              <text x={0} y={y + 4} fill="rgba(213,194,187,0.65)" fontSize="11">
                {tick}
              </text>
            </g>
          );
        })}

        <polyline fill="none" stroke="#ff7b54" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" points={lineFromKey('formScore')} />
        <polyline fill="none" stroke="#7ad7f0" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" points={lineFromKey('fsrScore')} />
        <polyline fill="none" stroke="#f7c56b" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" points={lineFromKey('fusionScore')} />

        {reps.map((rep, index) => {
          const x = leftPadding + (stepX * index);
          const formY = topPadding + usableHeight - (((rep.formScore ?? 0) / maxScore) * usableHeight);
          return (
            <g key={rep.repNumber}>
              <circle cx={x} cy={formY} r="5" fill="#ff7b54" />
              <text x={x} y={CHART_HEIGHT - 6} textAnchor="middle" fill="rgba(213,194,187,0.75)" fontSize="11">
                {rep.repNumber}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="report-chart-legend">
        <LegendDot color="#ff7b54" label="Form Score" />
        <LegendDot color="#7ad7f0" label="FSR Score" />
        <LegendDot color="#f7c56b" label="Fusion Score" />
      </div>
    </div>
  );
}

function RiskGauge({ riskScore }) {
  const clamped = Math.max(0, Math.min(100, riskScore || 0));
  const rotation = -90 + (clamped / 100) * 180;
  const tone = clamped >= 60 ? 'danger' : clamped >= 30 ? 'warning' : 'safe';

  return (
    <div className="risk-gauge">
      <div className="risk-gauge__dial">
        <div className="risk-gauge__arc" />
        <div className={`risk-gauge__needle risk-gauge__needle--${tone}`} style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} />
        <div className="risk-gauge__center">
          <span className="risk-gauge__value">{clamped}%</span>
          <span className="risk-gauge__label">Risk Score</span>
        </div>
      </div>
      <div className="risk-gauge__scale">
        <span>Safe</span>
        <span>Watch</span>
        <span>High</span>
      </div>
    </div>
  );
}

function drawPerformanceChart(pdf, reps, x, y, width, height) {
  if (!reps.length) {
    pdf.setFontSize(10);
    pdf.text('Not enough rep data to plot the chart.', x, y + 10);
    return;
  }

  const chartWidth = width;
  const chartHeight = height;
  const maxScore = Math.max(100, ...reps.flatMap((rep) => [rep.formScore ?? 0, rep.fsrScore ?? 0, rep.fusionScore ?? 0]));

  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(x, y, chartWidth, chartHeight, 2, 2);

  for (let i = 0; i <= 4; i += 1) {
    const gridY = y + 6 + ((chartHeight - 14) / 4) * i;
    pdf.setDrawColor(230, 230, 230);
    pdf.line(x + 8, gridY, x + chartWidth - 6, gridY);
  }

  const pointsFor = (key) =>
    reps.map((rep, index) => {
      const px = x + 12 + (index * ((chartWidth - 24) / Math.max(1, reps.length - 1)));
      const value = rep[key] ?? 0;
      const py = y + chartHeight - 8 - ((value / maxScore) * (chartHeight - 18));
      return [px, py];
    });

  const drawSeries = (points, color) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(1.2);
    for (let i = 1; i < points.length; i += 1) {
      pdf.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
    }
    points.forEach(([px, py]) => {
      pdf.setFillColor(...color);
      pdf.circle(px, py, 1.2, 'F');
    });
  };

  drawSeries(pointsFor('formScore'), [255, 123, 84]);
  drawSeries(pointsFor('fsrScore'), [122, 215, 240]);
  drawSeries(pointsFor('fusionScore'), [247, 197, 107]);

  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  reps.forEach((rep, index) => {
    const px = x + 12 + (index * ((chartWidth - 24) / Math.max(1, reps.length - 1)));
    pdf.text(String(rep.repNumber), px - 1.5, y + chartHeight - 2);
  });
}

function drawRepTable(pdf, reps, x, startY, width) {
  let y = startY;
  const rowHeight = 7;
  const columns = [
    ['Rep', 14],
    ['Form', 22],
    ['FSR', 18],
    ['Avg', 20],
    ['ROM', 30],
    ['Fusion', 24],
    ['Status', 22],
  ];

  pdf.setFillColor(245, 245, 245);
  pdf.rect(x, y, width, rowHeight, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  let currentX = x + 2;
  columns.forEach(([label, colWidth]) => {
    pdf.text(label, currentX, y + 4.8);
    currentX += colWidth;
  });
  y += rowHeight;

  pdf.setFont('helvetica', 'normal');
  reps.slice(0, 18).forEach((rep) => {
    currentX = x + 2;
    const values = [
      `#${rep.repNumber}`,
      String(rep.formScore ?? '-'),
      String(rep.fsrScore ?? '-'),
      String(rep.avgFsr ?? '-'),
      rep.minAngle !== null && rep.maxAngle !== null ? `${Math.round(rep.minAngle)}-${Math.round(rep.maxAngle)}` : '-',
      String(rep.fusionScore ?? '-'),
      rep.correct ? 'Good' : 'Needs Work',
    ];
    values.forEach((value, index) => {
      pdf.text(value, currentX, y + 4.8);
      currentX += columns[index][1];
    });
    y += rowHeight;
  });
}

function MiniRiskMetric({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-dark-600 bg-dark-800/70 p-3 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-dark-300">{label}</p>
      <p className={`text-xl font-bold mt-2 ${tone}`}>{value}</p>
    </div>
  );
}

function EmptyChartState({ message }) {
  return (
    <div className="report-empty-chart">
      <p>{message}</p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs text-dark-200">
      <span className="report-legend-dot" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function MetricCard({ icon, label, value, color = 'text-white' }) {
  return (
    <div className="glass-card p-5 text-center">
      {createElement(icon, { className: 'w-5 h-5 text-accent-primary mx-auto mb-2' })}
      <p className={`text-2xl font-bold ${color} tabular-nums`}>{value}</p>
      <p className="text-xs text-dark-300 mt-1">{label}</p>
    </div>
  );
}
