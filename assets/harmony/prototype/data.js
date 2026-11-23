/* Harmony Osteria — today's menu and the wild record behind it.
   Numbers are illustrative demo data for the concept. d = today's deviation of the wild species,
   −100 (far too few) … 0 (balanced) … +100 (far too many). */
const COURSES = ['Antipasto', 'Primo', 'Secondo', 'Dolce'];
const MENU = [
  [
    { it: 'Alici marinate e cozze', en: 'Marinated anchovies, mussels from La Spezia', sp: 'anchovy', farm: 'mussels', d: -30, short: 'ALICI',
      ing: 'anchovy, mussel, lemon, Taggiasca oil, parsley', all: 'fish · molluscs' },
    { it: 'Tonno rosso e orata', en: 'Raw bluefin tuna and sea bream, citrus', sp: 'bluefin tuna', farm: 'sea bream', d: 50, short: 'TONNO',
      ing: 'bluefin tuna, farmed sea bream, orange, fennel, salt', all: 'fish' },
    { it: 'Violino di camoscio e bresaola', en: 'Cured chamois leg and beef bresaola', sp: 'chamois', farm: 'beef', d: -84, short: 'CAMOSCIO',
      ing: 'chamois, beef, rye bread, mountain butter', all: 'gluten · milk' }
  ],
  [
    { it: 'Tagliolini al granchio blu e vongole', en: 'Thin egg pasta, blue crab and farmed clams', sp: 'blue crab', farm: 'clams', d: 80, short: 'GRANCHIO',
      ing: 'blue crab, Goro clams, Vermentino, garlic, parsley, egg pasta', all: 'gluten · egg · crustaceans · molluscs' },
    { it: 'Pappardelle alla lepre e coniglio', en: 'Wide pasta, hare and rabbit ragù', sp: 'hare', farm: 'rabbit', d: -88, short: 'LEPRE',
      ing: 'hare, rabbit, red wine, juniper, egg pasta', all: 'gluten · egg · celery' },
    { it: 'Tortelli di cervo e maiale', en: 'Ten tortelli, red deer and pork', sp: 'red deer', farm: 'pork', d: 40, short: 'CERVO',
      ing: 'red deer, pork, sage butter, Parmigiano', all: 'gluten · egg · milk' }
  ],
  [
    { it: 'Cinghiale e manzo', en: 'One cut of wild boar and beef, roasted together', sp: 'wild boar', farm: 'beef', d: 70, short: 'CINGHIALE',
      ing: 'wild boar, Cabannina beef, red wine, rosemary', all: 'sulphites' },
    { it: 'Capriolo e agnello', en: 'Roe deer and lamb, chestnut honey', sp: 'roe deer', farm: 'lamb', d: -50, short: 'CAPRIOLO',
      ing: 'roe deer, lamb, chestnut honey, thyme', all: 'none listed' },
    { it: 'Pesce spada e spigola', en: 'Swordfish and sea bass, capers and tomato', sp: 'swordfish', farm: 'sea bass', d: -70, short: 'SPADA',
      ing: 'swordfish, farmed sea bass, capers, tomato, oregano', all: 'fish' }
  ],
  [
    { it: 'Castagne, due boschi', en: 'Wild chestnuts and orchard marroni', sp: 'wild chestnut', farm: 'marroni', d: -10, short: 'CASTAGNE',
      ing: 'wild chestnut, marroni, chestnut honey, cream', all: 'milk · nuts' },
    { it: 'Pinoli e mandorle', en: 'Stone-pine nuts and Sicilian almonds', sp: 'pine nuts', farm: 'almonds', d: -40, short: 'PINOLI',
      ing: 'pine nuts, almonds, honey, egg white', all: 'nuts · egg' },
    { it: 'Crostata di more e lamponi', en: 'Tart of wild blackberries and garden raspberries', sp: 'blackberry', farm: 'raspberries', d: 30, short: 'MORE',
      ing: 'wild blackberry, raspberry, shortcrust', all: 'gluten · egg · milk' }
  ]
];
const OFF = d => d <= -80;                                  // too few to take any: not available today
const wildShare = d => Math.max(10, Math.min(90, Math.round((50 + d * 0.4) / 5) * 5));
const YESTERDAY = { anchovy: -20, 'bluefin tuna': 50, chamois: -80, 'blue crab': 70, hare: -88, 'red deer': 40,
  'wild boar': 70, 'roe deer': -40, swordfish: -70, 'wild chestnut': -10, 'pine nuts': -45, blackberry: 20 };

/* each species has its own record length; the upper band spreads it on a log scale */
const RECORD = {
  'anchovy': [32, [[32, 30], [20, 10], [12, -20], [5, -40], [1, -30]]],
  'bluefin tuna': [45, [[45, 20], [25, -40], [17, -80], [10, -40], [4, 20], [1, 40]]],
  'chamois': [40, [[40, -30], [25, 0], [12, -20], [4, -60], [1, -80]]],
  'blue crab': [12, [[12, 0], [6, 10], [3, 40], [1.5, 70], [.3, 80]]],
  'hare': [38, [[38, 10], [20, -30], [8, -60], [2, -80]]],
  'red deer': [55, [[55, -80], [35, -50], [18, -10], [6, 30], [1, 40]]],
  'wild boar': [50, [[50, -40], [30, 0], [15, 30], [6, 60], [1, 70]]],
  'roe deer': [45, [[45, -60], [25, -20], [10, 10], [3, -20], [1, -50]]],
  'swordfish': [40, [[40, 30], [22, -10], [12, -50], [5, -70], [1, -70]]],
  'wild chestnut': [70, [[70, 40], [50, -60], [30, -40], [12, -20], [3, -10]]],
  'pine nuts': [22, [[22, 20], [12, 0], [7, -40], [3, -50], [1, -40]]],
  'blackberry': [15, [[15, 0], [8, 20], [3, 30], [1, 30]]]
};
const PRICE = 85;   // fixed, four courses
