/* ============================================
   Lumière — дані: категорії, послуги, майстри
   Точка інтеграції: у продакшені цей файл
   замінюється відповіддю API/CRM.
   ============================================ */

const CATEGORIES = [
  { id: 'nails',       name: 'Манікюр і педикюр', tagline: 'Ідеальні лінії кутикули та стійке покриття' },
  { id: 'hair',        name: 'Волосся',            tagline: 'Стрижки, складне фарбування та відновлення' },
  { id: 'cosmetology', name: 'Косметологія',       tagline: 'Догляд за шкірою обличчя на професійних засобах' },
  { id: 'brows',       name: 'Брови та вії',       tagline: 'Архітектура погляду: форма, колір, ламінування' }
];

const SERVICES = [
  /* --- Манікюр і педикюр --- */
  { id: 'manicure-classic', category: 'nails', name: 'Класичний манікюр', duration: 60, price: 450,
    desc: 'Обробка кутикули, надання форми, полірування та живильна олійка.' },
  { id: 'manicure-gel', category: 'nails', name: 'Манікюр з гель-лаком', duration: 90, price: 650,
    desc: 'Апаратний манікюр із покриттям гель-лаком, стійкість до 3 тижнів.' },
  { id: 'nails-extension', category: 'nails', name: 'Нарощення нігтів', duration: 150, price: 950,
    desc: 'Моделювання гелем на верхніх формах, будь-яка довжина та дизайн.' },
  { id: 'pedicure-apparatus', category: 'nails', name: 'Апаратний педикюр', duration: 90, price: 700,
    desc: 'Делікатна апаратна обробка стоп та покриття гель-лаком.' },

  /* --- Волосся --- */
  { id: 'haircut-women', category: 'hair', name: 'Жіноча стрижка', duration: 60, price: 550,
    desc: 'Стрижка з урахуванням структури волосся, миття та укладка включені.' },
  { id: 'color-one-tone', category: 'hair', name: 'Фарбування в один тон', duration: 150, price: 1400,
    desc: 'Стійке фарбування преміальними барвниками з доглядом після процедури.' },
  { id: 'color-airtouch', category: 'hair', name: 'Складне фарбування AirTouch', duration: 240, price: 2800,
    desc: 'Плавні переливи кольору з ефектом вигорілого волосся. Ціна від довжини.' },
  { id: 'styling', category: 'hair', name: 'Укладка', duration: 45, price: 400,
    desc: 'Локони, гладка укладка або текстурні хвилі під вашу подію.' },
  { id: 'hair-botox', category: 'hair', name: 'Ботокс для волосся', duration: 90, price: 1200,
    desc: 'Глибоке відновлення структури: блиск, гладкість, зволоження.' },

  /* --- Косметологія --- */
  { id: 'face-cleaning', category: 'cosmetology', name: 'Комбінована чистка обличчя', duration: 75, price: 900,
    desc: 'Ультразвукова та механічна чистка із заспокійливою маскою.' },
  { id: 'face-massage', category: 'cosmetology', name: 'Масаж обличчя', duration: 50, price: 600,
    desc: 'Скульптурний масаж: ліфтинг-ефект, зняття напруги, здоровий колір.' },
  { id: 'peeling', category: 'cosmetology', name: 'Хімічний пілінг', duration: 45, price: 800,
    desc: 'М’яке оновлення шкіри кислотами, підбір протоколу за типом шкіри.' },

  /* --- Брови та вії --- */
  { id: 'brows-shape', category: 'brows', name: 'Корекція та фарбування брів', duration: 40, price: 350,
    desc: 'Архітектура брів: підбір форми, корекція воском, фарбування хною або фарбою.' },
  { id: 'brows-lamination', category: 'brows', name: 'Ламінування брів', duration: 60, price: 600,
    desc: 'Слухняні, доглянуті брови з ефектом укладки до 6 тижнів.' },
  { id: 'lashes-lamination', category: 'brows', name: 'Ламінування вій', duration: 75, price: 650,
    desc: 'Вигин, колір і живлення власних вій без нарощення.' },
  { id: 'lashes-extension', category: 'brows', name: 'Нарощення вій', duration: 120, price: 900,
    desc: 'Класика або 2D — природний об’єм, підбір вигину під форму ока.' }
];

/* workDays: 0 = неділя … 6 = субота; hours: [початок, кінець) робочого дня */
const MASTERS = [
  {
    id: 'olena', name: 'Олена Кравець', role: 'Топ-майстер манікюру',
    photo: 'assets/img/master-olena.svg',
    serviceIds: ['manicure-classic', 'manicure-gel', 'nails-extension', 'pedicure-apparatus'],
    workDays: [1, 2, 3, 4, 5], hours: [10, 19],
    bio: 'Досвід 9 років. Чемпіонка Nail Expo 2023 у номінації «Салонний френч». Працює у чотири руки з дизайнами будь-якої складності.'
  },
  {
    id: 'iryna', name: 'Ірина Мельник', role: 'Майстер манікюру та педикюру',
    photo: 'assets/img/master-iryna.svg',
    serviceIds: ['manicure-classic', 'manicure-gel', 'pedicure-apparatus'],
    workDays: [2, 3, 4, 5, 6], hours: [11, 20],
    bio: 'Досвід 6 років. Спеціалізується на медичному педикюрі та роботі з проблемною кутикулою.'
  },
  {
    id: 'maryna', name: 'Марина Шевчук', role: 'Стиліст-колорист',
    photo: 'assets/img/master-maryna.svg',
    serviceIds: ['haircut-women', 'color-one-tone', 'color-airtouch', 'styling', 'hair-botox'],
    workDays: [1, 3, 4, 5, 6], hours: [10, 19],
    bio: 'Досвід 11 років. Сертифікований технолог Wella та L’Oréal Professionnel, авторка курсу з AirTouch.'
  },
  {
    id: 'daria', name: 'Дар’я Романюк', role: 'Перукар-стиліст',
    photo: 'assets/img/master-daria.svg',
    serviceIds: ['haircut-women', 'styling', 'hair-botox'],
    workDays: [1, 2, 4, 5, 6], hours: [9, 18],
    bio: 'Досвід 5 років. Стрижки на кучеряве волосся, весільні та вечірні укладки.'
  },
  {
    id: 'sofia', name: 'Софія Гончар', role: 'Косметолог-естетист',
    photo: 'assets/img/master-sofia.svg',
    serviceIds: ['face-cleaning', 'face-massage', 'peeling'],
    workDays: [1, 2, 3, 5, 6], hours: [10, 18],
    bio: 'Досвід 8 років. Медична освіта, протоколи доглядів на космецевтиці Image Skincare та Christina.'
  },
  {
    id: 'kateryna', name: 'Катерина Білан', role: 'Lash & brow майстер',
    photo: 'assets/img/master-kateryna.svg',
    serviceIds: ['brows-shape', 'brows-lamination', 'lashes-lamination', 'lashes-extension'],
    workDays: [1, 2, 3, 4, 6], hours: [10, 19],
    bio: 'Досвід 7 років. Понад 4000 задоволених поглядів: від природної класики до виразного 2D.'
  }
];

/* --- Хелпери --- */
function getServiceById(id) {
  return SERVICES.find(function (s) { return s.id === id; }) || null;
}
function getMasterById(id) {
  return MASTERS.find(function (m) { return m.id === id; }) || null;
}
function getMastersByService(serviceId) {
  return MASTERS.filter(function (m) { return m.serviceIds.indexOf(serviceId) !== -1; });
}
function formatPrice(price) {
  return price + ' грн';
}
function formatDuration(min) {
  if (min < 60) return min + ' хв';
  var h = Math.floor(min / 60), m = min % 60;
  return m ? h + ' год ' + m + ' хв' : h + ' год';
}
