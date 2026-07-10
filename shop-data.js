/* ============================================
   Lumière Shop — каталог товарів
   Точка інтеграції: у продакшені цей файл
   замінюється відповіддю API/CMS.
   ============================================ */

var SHOP_CATEGORIES = [
  { id: 'nails', name: 'Догляд за нігтями', tagline: 'Салонний результат удома' },
  { id: 'hair',  name: 'Догляд за волоссям', tagline: 'Професійні формули для щоденного догляду' },
  { id: 'face',  name: 'Косметика для обличчя', tagline: 'Космецевтика, яку обирають наші косметологи' },
  { id: 'gift',  name: 'Подарункові сертифікати', tagline: 'Найкращий подарунок — час для себе' }
];

var SHOP_PRODUCTS = [
  /* --- Догляд за нігтями --- */
  { id: 'prod_top_coat', name: 'Топове покриття для нігтів', category: 'nails', price: 320,
    description: 'Глянцевий фініш без сколів до 3 тижнів.',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=400&q=80', inStock: true },
  { id: 'prod_cuticle_oil', name: 'Олійка для кутикули', category: 'nails', price: 240,
    description: 'Мигдаль і вітамін Е — живлення та доглянутий вигляд щодня.',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=400&q=80', inStock: true },
  { id: 'prod_nail_strong', name: 'Зміцнювач для нігтів', category: 'nails', price: 280,
    description: 'Кератиновий комплекс проти ламкості та розшарування.',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=80', inStock: true },

  /* --- Догляд за волоссям --- */
  { id: 'prod_shampoo', name: 'Безсульфатний шампунь', category: 'hair', price: 450,
    description: 'Делікатне очищення, зберігає колір після фарбування.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80', inStock: true },
  { id: 'prod_hair_mask', name: 'Відновлювальна маска для волосся', category: 'hair', price: 520,
    description: 'Глибоке живлення за 10 хвилин, для сухого та пористого волосся.',
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=400&q=80', inStock: true },
  { id: 'prod_hair_serum', name: 'Сироватка для кінчиків', category: 'hair', price: 390,
    description: 'Запаює посічені кінчики, додає блиску без обтяження.',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80', inStock: true },

  /* --- Косметика для обличчя --- */
  { id: 'prod_face_cream', name: 'Зволожувальний крем для обличчя', category: 'face', price: 680,
    description: 'Гіалуронова кислота та церамід — 24 години зволоження.',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80', inStock: true },
  { id: 'prod_face_serum', name: 'Сироватка з вітаміном C', category: 'face', price: 750,
    description: 'Сяйво та рівний тон, антиоксидантний захист шкіри.',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80', inStock: true },
  { id: 'prod_face_mask', name: 'Альгінатна маска', category: 'face', price: 350,
    description: 'Ліфтинг-ефект і заспокоєння — як після салонної процедури.',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=400&q=80', inStock: true },

  /* --- Подарункові сертифікати --- */
  { id: 'prod_gift_500', name: 'Подарунковий сертифікат 500 грн', category: 'gift', price: 500,
    description: 'Діє на будь-яку послугу чи товар салону. Термін дії — 6 місяців.',
    image: 'assets/img/shop-gift-500.svg', inStock: true },
  { id: 'prod_gift_1000', name: 'Подарунковий сертифікат 1000 грн', category: 'gift', price: 1000,
    description: 'Діє на будь-яку послугу чи товар салону. Термін дії — 6 місяців.',
    image: 'assets/img/shop-gift-1000.svg', inStock: true },
  { id: 'prod_gift_2000', name: 'Подарунковий сертифікат 2000 грн', category: 'gift', price: 2000,
    description: 'Діє на будь-яку послугу чи товар салону. Термін дії — 6 місяців.',
    image: 'assets/img/shop-gift-2000.svg', inStock: true }
];

function getShopProduct(id) {
  return SHOP_PRODUCTS.find(function (p) { return p.id === id; }) || null;
}
