const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// Runs the real gallery scripts against the pointer lifecycle that touch browsers
// use: a card's implicit capture is lost and bubbles when the stage captures it.
function fixture(file, width) {
  function node() {
    const handlers = {}, attributes = {}, classes = new Set();
    return {
      textContent: '', clientWidth: width, tabIndex: 0,
      style: {setProperty() {}},
      classList: {add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value)},
      setAttribute: (key, value) => { attributes[key] = String(value); },
      getAttribute: key => attributes[key], focus() {},
      addEventListener: (type, callback) => { (handlers[type] ||= []).push(callback); },
      emit(type, values = {}) {
        const event = {type, target: this, button: 0, isPrimary: true, pointerId: 7, pointerType: 'touch', clientX: 200, clientY: 100, detail: 1, preventDefault() {}, ...values};
        for (const handler of handlers[type] || []) handler(event);
      }
    };
  }
  const stage = node(), count = node(), title = node(), prev = node(), next = node();
  const captures = new Set();
  stage.setPointerCapture = id => captures.add(id);
  stage.hasPointerCapture = id => captures.has(id);
  stage.releasePointerCapture = id => { captures.delete(id); stage.emit('lostpointercapture', {pointerId: id}); };
  const dots = Array.from({length: 6}, node);
  const links = [], covers = Array.from({length: 6}, (_, index) => {
    const card = node(), link = node(), heading = node(), copy = node(), price = node(), status = node(), image = node();
    heading.textContent = `Example ${index + 1}`; copy.textContent = `Description ${index + 1}`;
    price.textContent = 'Example scope'; status.textContent = 'Example gallery';
    link.setAttribute('href', `/example-${index + 1}`); image.setAttribute('src', `/image-${index + 1}.webp`);
    const children = {'h2': heading, '.portfolio-image': link, 'img': image, '.portfolio-price': price, '.eyebrow': status, '.portfolio-copy p:not(.eyebrow):not(.portfolio-price)': copy};
    card.querySelector = selector => children[selector]; links.push(link); return card;
  });
  const children = {'.flow-stage': stage, '[data-flow-prev]': prev, '[data-flow-next]': next, '.flow-count': count, '.flow-title': title, '.flow-status': node(), '.flow-description': node(), '.flow-price': node(), '.flow-open': node()};
  const player = {querySelector: selector => children[selector], querySelectorAll: selector => selector === '.portfolio-card' ? covers : dots};
  let clock = 1000;
  const window = node(), history = {state: {}, replaceState(value) {this.state = value;}};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {document: {querySelector: () => player}, window, history, performance: {now: () => clock}, ResizeObserver: class {observe() {}}}, {filename: file});
  return {stage, count, title, links, dots, prev, next, window, tick: ms => {clock += ms;}};
}

function start(f) { f.stage.emit('pointerdown', {target: f.links[0]}); }
function move(f, dx, dy = 0) { f.stage.emit('pointermove', {clientX: 200 + dx, clientY: 100 + dy}); }
function finish(f, dx, type = 'pointerup') { f.stage.emit(type, {clientX: 200 + dx}); }
const assetRoot = process.env.GALLERY_ASSETS || path.resolve(__dirname, '../../assets');
for (const script of ['showcase-gallery.js', 'portfolio-flow.js']) {
  const source = path.join(assetRoot, script);
  for (const width of [320, 390, 430, 1200]) {
    test(`${script} ${width}px: card capture handoff must not cancel swipe`, () => {
      const f = fixture(source, width); start(f); move(f, -80);
      f.stage.emit('lostpointercapture', {target: f.links[0]});
      move(f, -120); finish(f, -120);
      assert.equal(f.count.textContent, '2 / 6');
      assert.equal(f.dots[1].getAttribute('aria-pressed'), 'true');
      assert.equal(f.stage.classList.contains('is-dragging'), false);
    });
    test(`${script} ${width}px: swipe right wraps backward`, () => {
      const f = fixture(source, width); start(f); move(f, 80); finish(f, 80);
      assert.equal(f.count.textContent, '6 / 6');
    });
    test(`${script} ${width}px: real cancellation resets drag`, () => {
      const f = fixture(source, width); start(f); move(f, -80); finish(f, -80, 'pointercancel');
      assert.equal(f.count.textContent, '1 / 6');
      assert.equal(f.stage.classList.contains('is-dragging'), false);
    });
    test(`${script} ${width}px: vertical scroll and a short tap do not swipe`, () => {
      const f = fixture(source, width); start(f); move(f, 10, 90); finish(f, 10, 'pointercancel');
      assert.equal(f.count.textContent, '1 / 6');
      start(f); move(f, 8); finish(f, 8); assert.equal(f.count.textContent, '1 / 6');
    });
  }
  test(`${script}: delayed compatibility click cannot undo a swipe`, () => {
    const f = fixture(source, 390); start(f); move(f, -100); finish(f, -100);
    f.tick(400); f.links[0].emit('click'); assert.equal(f.count.textContent, '2 / 6');
    start(f); finish(f, 0); f.links[0].emit('click'); assert.equal(f.count.textContent, '1 / 6');
  });
  test(`${script}: keyboard remains usable immediately after swipe`, () => {
    const f = fixture(source, 390); start(f); move(f, -100); finish(f, -100);
    f.links[2].emit('click', {detail: 0}); assert.equal(f.count.textContent, '3 / 6');
    f.stage.emit('keydown', {key: 'ArrowRight'}); assert.equal(f.count.textContent, '4 / 6');
    f.stage.emit('keydown', {key: 'Home'}); assert.equal(f.count.textContent, '1 / 6');
    f.prev.emit('click'); assert.equal(f.count.textContent, '6 / 6');
    f.next.emit('click'); assert.equal(f.count.textContent, '1 / 6');
  });
  test(`${script}: genuine stage capture loss resets safely`, () => {
    const f = fixture(source, 390); start(f); move(f, -80); f.stage.emit('lostpointercapture');
    finish(f, -80); assert.equal(f.count.textContent, '1 / 6');
    assert.equal(f.stage.classList.contains('is-dragging'), false);
  });
  test(`${script}: another finger cannot replace the active gesture`, () => {
    const f = fixture(source, 390); start(f);
    f.stage.emit('pointerdown', {pointerId: 8, isPrimary: false});
    f.stage.emit('pointermove', {pointerId: 8, clientX: 20});
    move(f, -100); finish(f, -100); assert.equal(f.count.textContent, '2 / 6');
  });
}
