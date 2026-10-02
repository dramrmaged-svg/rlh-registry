// VERBATIM copy of V116.15 script block 15 (sirtSourceParity) num/variance/calculateDerived, for regression testing only.
// Contains no patient data. Do not edit: the tests prove the patch leaves these formulas unchanged.
  function num(v) {
    const x = parseFloat(v);
    return Number.isFinite(x) ? x : 0;
  }
  function variance(actual, planned) {
    actual = num(actual);
    planned = num(planned);
    return planned > 0 ? ((actual - planned) / planned) * 100 : null;
  }
  function calculateDerived(d, positions = []) {
    const out = {};
    const cal = d.calibrationDateTime,
      tx = d.treatmentDateTime,
      a = num(d.activityAtCalibration);
    if (cal && tx && a) {
      const h = (new Date(tx) - new Date(cal)) / 3600000;
      if (h >= 0)
        out.decayCorrectedActivity = (a * Math.pow(0.5, h / 64.1)).toFixed(3);
    }
    const assayed = num(d.assayedActivity),
      delivered = num(d.deliveredActivity),
      residual = num(d.residualActivity),
      perfused = num(d.treatmentPerfusedCBCTVolume),
      tumour = num(d.treatmentTumourVolume),
      pred = num(d.treatmentPredictedTumourDose),
      actual = num(d.actualTumourMeanDose);
    out.deliveryEfficiency =
      assayed > 0 ? ((delivered / assayed) * 100).toFixed(1) : "";
    out.residualFraction =
      assayed > 0 ? ((residual / assayed) * 100).toFixed(1) : "";
    out.tumourBurdenPercent =
      perfused > 0 ? ((tumour / perfused) * 100).toFixed(1) : "";
    out.calculatedNormalLiverVolume =
      perfused >= tumour && perfused > 0 ? (perfused - tumour).toFixed(1) : "";
    out.activityPerPerfusedLitre =
      perfused > 0 ? (delivered / (perfused / 1000)).toFixed(2) : "";
    out.tumourDoseDifference =
      pred > 0 && actual > 0 ? (actual - pred).toFixed(1) : "";
    // M5.4 clinician-requested angiosome-to-tumour ratios (dimensionless).
    // CBCT A/T uses the mapping CBCT perfused volume divided by mapping tumour volume.
    // MAA A/T uses the MAA/SPECT-CT perfused volume divided by the MAA tumour volume,
    // falling back to the mapping tumour volume only when the MAA-specific tumour volume is blank.
    const mapPerfused = num(d.perfusedCBCTVolume),
      mapTumour = num(d.tumourVolume),
      maaPerfused = num(d.maaPerfusedVolume),
      maaTumour = num(d.maaTumourVolume || d.tumourVolume);
    out.cbctAtRatio =
      mapPerfused > 0 && mapTumour > 0
        ? (mapPerfused / mapTumour).toFixed(2)
        : "";
    out.maaAtRatio =
      maaPerfused > 0 && maaTumour > 0
        ? (maaPerfused / maaTumour).toFixed(2)
        : "";
    const av = variance(
        d.deliveredActivity,
        d.plannedActivity || d.prescribedActivity,
      ),
      pv = variance(d.postPerfusedVolume, d.treatmentPerfusedCBCTVolume),
      tv = variance(
        d.actualTumourMeanDose || d.deliveredTumourDose,
        d.treatmentPredictedTumourDose,
      ),
      nv = variance(
        d.actualNormalLiverMeanDose || d.deliveredNormalLiverDose,
        d.treatmentPredictedNormalLiverDose,
      );
    out.activityVariancePercent = av === null ? "" : av.toFixed(1);
    out.perfusedVolumeVariancePercent = pv === null ? "" : pv.toFixed(1);
    out.tumourDoseVariancePercent = tv === null ? "" : tv.toFixed(1);
    out.normalLiverDoseVariancePercent = nv === null ? "" : nv.toFixed(1);
    const vals = [av, pv, tv, nv].filter((x) => x !== null).map(Math.abs);
    out.qaClassification = vals.length
      ? Math.max(...vals) <= 10
        ? "Concordant"
        : Math.max(...vals) <= 20
          ? "Minor variance"
          : "Clinically significant variance"
      : "";
    out.positionsTotalActivity = positions
      .reduce((s, p) => s + num(p.activity), 0)
      .toFixed(2);
    out.positionsTotalPerfused = positions
      .reduce((s, p) => s + num(p.perfusedVolume), 0)
      .toFixed(1);
    out.positionsTotalTumour = positions
      .reduce((s, p) => s + num(p.tumourVolume), 0)
      .toFixed(1);
    return out;
  }
module.exports = { calculateDerived };
