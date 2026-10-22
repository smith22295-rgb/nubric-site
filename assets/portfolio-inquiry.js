(() => {
  'use strict';
  const notes = document.getElementById('brief-notes');
  const feature = new URLSearchParams(location.search).get('feature');
  const allowed = ["A to Z Engraving — Bulk order intake", "A to Z Engraving — Color choices", "A to Z Engraving — Drinkware catalog", "A to Z Engraving — Personalization", "A to Z Engraving — Product categories", "A to Z Engraving — Storefront", "Axiom Tags — Label builder", "Axiom Tags — Material & mounting", "Axiom Tags — Preview & pricing", "Axiom Tags — Storefront", "File2Forge — AI advisor", "File2Forge — Order builder", "File2Forge — Price breakdown", "File2Forge — Storefront", "Food Plot Calculator — Advertising layout", "Food Plot Calculator — Blend planner", "Food Plot Calculator — Content library", "Food Plot Calculator — Seed calculator", "Food Plot Calculator — Website design", "Harmony Home Services — Home Watch", "Harmony Home Services — Homepage", "Harmony Home Services — Massage", "Harmony Home Services — On a phone", "Harmony Home Services — Pool Care", "Harmony Home Services — Pricing", "Harmony Home Services — Service page", "Yonder Maps — Browse by place", "Yonder Maps — First impression", "Yonder Maps — Product detail", "Yonder Maps — The story"];
  if (notes && !notes.value.trim() && allowed.includes(feature)) {
    notes.value = `I liked the ${feature} view in your portfolio. I would like to discuss something similar.\n\nMy idea:\n`;
  }
})();
