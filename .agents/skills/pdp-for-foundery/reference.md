# PDP For Foundery — Section Reference

Quick copy-paste anchors for each section. See `pdp/index.php` for full implementation.

## Header

```html
<header class="shapes-header">
  <div class="shapes-header__inner">
    <button class="shapes-header__menu" aria-label="Menu">...</button>
    <a class="shapes-header__logo" href="#">Brand Name</a>
    <div class="shapes-header__actions">
      <button class="shapes-header__icon" aria-label="Search">...</button>
      <button class="shapes-header__icon" aria-label="Cart">...</button>
    </div>
  </div>
</header>
```

## Gallery frame

```html
<div class="shapes-gallery__frame">
  <span class="shapes-gallery__badge">CRUNCHY!</span>
  <img class="shapes-gallery__image" src="..." alt="Product">
  <div class="shapes-gallery__nav">
    <button class="shapes-gallery__arrow shapes-gallery__arrow--prev">...</button>
    <button class="shapes-gallery__arrow shapes-gallery__arrow--next">...</button>
  </div>
</div>
```

CSS essentials:
```css
.shapes-gallery__frame {
  border: 3px solid #111;
  box-shadow: 6px 6px 0 0 #111;
}
.shapes-gallery__badge {
  background: #7cff00;
  clip-path: polygon(/* starburst */);
  transform: rotate(-8deg);
}
.shapes-gallery__arrow {
  border-radius: 50%;
  border: 3px solid #111;
  background: #7cff00;
}
```

## Product CTAs

```html
<button class="shapes-btn shapes-btn--cart">Add to Cart</button>
<button class="shapes-btn shapes-btn--buy">Buy It Now</button>
```

```css
.shapes-btn {
  border: 3px solid #111;
  border-radius: 999px;
  font-family: "Archivo Black", sans-serif;
  text-transform: uppercase;
}
.shapes-btn--cart { background: #fff; }
.shapes-btn--buy  { background: #7cff00; }
```

## Tabs

```html
<div class="shapes-tabs">
  <nav class="shapes-tabs__nav">
    <button class="shapes-tabs__btn shapes-tabs__btn--active" data-tab="ingredients">Ingredients</button>
    <button class="shapes-tabs__btn" data-tab="shipping">Shipping</button>
    <button class="shapes-tabs__btn" data-tab="wholesale">Wholesale</button>
  </nav>
  <div class="shapes-tabs__panel shapes-tabs__panel--active" data-tab="ingredients">...</div>
  <div class="shapes-tabs__panel" data-tab="shipping">...</div>
  <div class="shapes-tabs__panel" data-tab="wholesale">...</div>
</div>
```

## Flavor scale (PHP)

```php
$flavors = [
  ['label' => 'Sweet',  'level' => 2],
  ['label' => 'Salty',  'level' => 3],
  ['label' => 'Sour',   'level' => 0],
  ['label' => 'Bitter', 'level' => 0],
  ['label' => 'Umami',  'level' => 4],
];
foreach ($flavors as $f): ?>
<div class="shapes-flavors__row">
  <span class="shapes-flavors__label"><?= $f['label'] ?></span>
  <div class="shapes-flavors__dots">
    <?php for ($i = 0; $i < 5; $i++): ?>
    <span class="shapes-flavors__dot<?= $i < $f['level'] ? ' shapes-flavors__dot--filled' : '' ?>"></span>
    <?php endfor; ?>
  </div>
</div>
<?php endforeach; ?>
```

## Promo marquee (GSAP)

```html
<section class="shapes-promo">
  <div class="shapes-promo__track">
    <span class="shapes-promo__text">Scrolling copy • Scrolling copy • </span>
  </div>
</section>
```

```javascript
track.innerHTML = track.innerHTML + track.innerHTML;
gsap.to(track, { x: -track.scrollWidth / 2, duration: 20, ease: "none", repeat: -1 });
```

## Related product card

```html
<article class="shapes-related__card">
  <img class="shapes-related__image" src="..." alt="Product name">
  <div class="shapes-related__body">
    <h3 class="shapes-related__name">Product Name</h3>
    <p class="shapes-related__price">$25.00</p>
    <button class="shapes-related__add">Add to Cart</button>
  </div>
</article>
```

## Demo store product data (Crispy Chili Oil)

| Field | Value |
|-------|-------|
| Title | Crispy Chili Oil |
| Price | $12.00 |
| Sweet | 2/5 |
| Salty | 3/5 |
| Sour | 0/5 |
| Bitter | 0/5 |
| Umami | 4/5 |
| Ingredients | Dried chili peppers, garlic, onion, sesame oil, soy sauce, sugar, salt, spices. |
| Shipping | Dispatches within 24 hours of ordering! |
| Wholesale | Looking to stock your shelves or running a restaurant? Get in touch. |

Related: Wild Yuzu Garlic Rub ($25), Umami Chili Salt ($17), Pina Picante Hot Sauce ($12).
