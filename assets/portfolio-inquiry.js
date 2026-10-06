(() => {
  'use strict';
  const notes = document.getElementById('brief-notes');
  const feature = new URLSearchParams(location.search).get('feature');
  const allowed = ["File2Forge — Order builder", "File2Forge — Price breakdown", "File2Forge — AI advisor", "File2Forge — Storefront", "Axiom Tags — Label builder", "Axiom Tags — Material & mounting", "Axiom Tags — Preview & pricing", "Axiom Tags — Storefront", "Yonder Maps — First impression", "Yonder Maps — Browse by place", "Yonder Maps — Product detail", "Yonder Maps — The story", "Harmony Home Services — Homepage", "Harmony Home Services — Service page", "Harmony Home Services — Pricing", "Harmony Home Services — On a phone", "Food Plot Calculator — Seed calculator", "Food Plot Calculator — Blend planner", "Food Plot Calculator — Content library", "Food Plot Calculator — Advertising layout", "A to Z Engraving — Storefront", "A to Z Engraving — Product categories", "A to Z Engraving — Bulk order intake", "A to Z Engraving — Drinkware catalog", "A to Z Engraving — Color choices", "A to Z Engraving — Personalization"];
  if (notes && !notes.value.trim() && allowed.includes(feature)) {
    notes.value = `I liked the ${feature} view in your portfolio. I would like to discuss something similar.\n\nMy idea:\n`;
  }
})();
