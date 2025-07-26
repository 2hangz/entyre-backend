const mongoose = require('../db/mongoose');

const mcdaSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "MCDA Interactive Data Visualization"
  },
  description: {
    type: String,
    default: "Multi-Criteria Decision Analysis (MCDA) interactive data visualization page, supporting Excel data import, weight adjustment, Pareto analysis, and multiple visualization methods."
  },
  excel_data_folder: {
    type: String,
    default: "/api/files"
  },
  chart_types: {
    type: [String],
    default: ["bar", "line", "radar"]
  },
  mcda_methods: {
    type: [String],
    default: ["weighted_sum", "cp", "topsis"]
  },
  cp_p_range: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 10 },
    step: { type: Number, default: 1 }
  },
  topsis_ideal_types: {
    type: [String],
    default: ["benefit", "cost"]
  },
  table_settings: {
    allow_edit: { type: Boolean, default: true },
    allow_lock: { type: Boolean, default: true },
    show_rank: { type: Boolean, default: true }
  },
  weight_settings: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 1 },
    step: { type: Number, default: 0.01 },
    allow_lock: { type: Boolean, default: true },
    show_total: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('MCDA', mcdaSchema);