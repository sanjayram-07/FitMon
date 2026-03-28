import jsPDF from 'jspdf';

const getTimestamp = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const calculateInjuryRisk = (postureScoreValue, averageFsrValue, repCountValue, backendScore) => {
  let totalRisk = Number.isFinite(backendScore) ? backendScore : null;

  if (totalRisk === null) {
    const postureRisk = Math.max(0, 100 - postureScoreValue);
    const fsrRisk = averageFsrValue < 20
      ? (20 - averageFsrValue) * 2
      : averageFsrValue > 80
        ? (averageFsrValue - 80) * 1.5
        : 0;
    const repRisk = repCountValue > 30 ? Math.min((repCountValue - 30) * 1.5, 30) : 0;
    totalRisk = (postureRisk * 0.5) + (fsrRisk * 0.3) + (repRisk * 0.2);
  }

  const bounded = Math.max(0, Math.min(100, Math.round(totalRisk)));
  if (bounded < 25) return { level: 'Low', score: bounded, color: 'success' };
  if (bounded < 55) return { level: 'Moderate', score: bounded, color: 'warning' };
  return { level: 'High', score: bounded, color: 'danger' };
};

export const getReportPdfFileName = (report) => {
  const id = report?.sessionId || report?.id || report?.firestoreId || 'session';
  return `fitmon-report-${id}.pdf`;
};

export const buildReportPdf = (report) => {
  if (!report) return null;

  const insights = report.insights || {};
  const reps = report.perRepData || report.repHistory || [];
  const grade = insights.overallGrade || 'C';

  const averageFsrValue = Number.isFinite(report.avgFsr)
    ? report.avgFsr
    : reps.length
      ? reps.reduce((sum, rep) => sum + (rep.avgFsr ?? 0), 0) / reps.length
      : 0;

  const postureScoreValue = report.avgPostureScore ?? 0;
  const repCountValue = report.totalReps ?? 0;
  const injuryRisk = calculateInjuryRisk(
    postureScoreValue,
    averageFsrValue,
    repCountValue,
    report.injuryRiskScore,
  );

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

  const startedAtTs = getTimestamp(report.startedAt) || Date.now();

  pdf.setFillColor(255, 123, 84);
  pdf.roundedRect(margin, y, pageWidth - margin * 2, 26, 4, 4, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('FitMon Session Report', margin + 6, y + 11);
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date(startedAtTs).toLocaleString()}`, margin + 6, y + 19);
  y += 36;

  addSectionTitle('Overview');
  addBodyText(insights.summary || `You completed ${report.totalReps ?? 0} reps with ${report.accuracy ?? 0}% accuracy.`);

  ensureSpace(30);
  const metrics = [
    ['Grade', grade],
    ['Total Reps', String(report.totalReps ?? 0)],
    ['Accuracy', `${report.accuracy ?? 0}%`],
    ['Duration', formatDuration(report.duration)],
    ['Posture', String(report.avgPostureScore ?? 0)],
    ['Injury Risk', `${injuryRisk.score}%`],
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
  addBodyText(`Injury risk score: ${injuryRisk.score}%. Incorrect reps: ${report.incorrectReps ?? 0}. Ineffective reps: ${report.ineffectiveReps ?? 0}.`);

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

  return pdf;
};

const drawPerformanceChart = (pdf, reps, x, y, width, height) => {
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
};

const drawRepTable = (pdf, reps, x, startY, width) => {
  let y = startY;
  const rowHeight = 7;
  const columns = [
    ['Rep', 14],
    ['Form', 22],
    ['Press', 18],
    ['Avg', 20],
    ['Range', 30],
    ['Consist', 24],
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
};
