export const SERVICES = {
  interior: {
    label: 'Interiér vozidla',
    packages: [
      {
        id: 'int-base',
        name: 'Interiér Základ',
        price: 2090,
        includes: [
          'Hloubkové vysátí interiéru',
          'Provonění interiéru',
          'Čištění plastů',
          'Mytí oken',
        ],
        addons: [],
      },
      {
        id: 'int-extra',
        name: 'Interiér Extra',
        price: 2990,
        includes: [
          'Hloubkové vysátí interiéru',
          'Čištění kožených sedaček',
          'Tepování látkových sedaček',
          'Tepování zavazadlového prostoru',
          'Tepování koberců, koberečků',
          'Provonění interiéru',
          'Čištění plastů',
          'Čištění zádveří',
          'Mytí oken',
        ],
        addons: [
          { id: 'int-extra-light', name: 'Světlý interiér', price: 1500 },
          { id: 'int-extra-kombi', name: 'KOMBI — příplatek', price: 300, group: 'vehicle' },
          { id: 'int-extra-suv',   name: 'SUV — příplatek',  price: 500, group: 'vehicle' },
        ],
      },
    ],
    extras: [
      { id: 'ex-motor',   name: 'Čištění motoru',  price: 300,  unit: null },
      { id: 'ex-plastic', name: 'Výživa plastů',   price: 400,  unit: null },
      { id: 'ex-leather', name: 'Výživa kůže',     price: 400,  unit: null },
      { id: 'ex-alc',     name: 'Alcantara',        price: 200,  unit: null },
      { id: 'ex-belts',   name: 'Čištění pásů',    price: 50,   unit: 'ks' },
    ],
  },
  exterior: {
    label: 'Exteriér',
    packages: [
      {
        id: 'ext-wash',
        name: 'Exteriér',
        price: 990,
        includes: [
          'Ruční mytí',
          'Mytí s aktivní pěnou',
          'Odstranění hmyzu',
          'Mytí kol a podběhů',
        ],
        addons: [
          { id: 'ext-wash-kombi', name: 'KOMBI — příplatek', price: 300, group: 'vehicle' },
          { id: 'ext-wash-suv',   name: 'SUV — příplatek',  price: 500, group: 'vehicle' },
        ],
      },
    ],
    extras: [
      { id: 'ext-sealant',      name: 'Ceramic sealant',              price: 500, unit: null },
      { id: 'ext-sealant-kombi', name: 'Ceramic sealant — KOMBI příplatek', price: 300, unit: null },
      { id: 'ext-sealant-suv',  name: 'Ceramic sealant — SUV příplatek',  price: 500, unit: null },
    ],
  },
  upholstery: {
    label: 'Čalounění',
    fabric: [
      { id: 'fab-corner', name: 'Sedačka rohová',         price: 1300 },
      { id: 'fab-u',      name: 'Sedačka ve tvaru U',     price: 1500 },
      { id: 'fab-4',      name: '4 místná sedačka',       price: 950  },
      { id: 'fab-3',      name: '3 místná sedačka',       price: 850  },
      { id: 'fab-arm',    name: 'Křeslo',                 price: 450  },
      { id: 'fab-ott',    name: 'Taburet',                price: 300  },
      { id: 'fab-ch',     name: 'Židle',                  price: 100  },
      { id: 'fab-rug',    name: 'Kusový koberec',         price: 450  },
    ],
    leather: [
      { id: 'lea-corner', name: 'Kožená sedačka rohová',  price: 1700 },
      { id: 'lea-u',      name: 'Kožená sedačka U',       price: 2200 },
      { id: 'lea-4',      name: '4 místná sedačka',       price: 1500 },
      { id: 'lea-3',      name: '3 místná sedačka',       price: 1150 },
      { id: 'lea-arm',    name: 'Kožené křeslo',          price: 650  },
      { id: 'lea-ott',    name: 'Kožený taburet',         price: 320  },
      { id: 'lea-ch',     name: 'Kožená židle',           price: 170  },
    ],
  },
};

// 3-column structure for the Settings price editor
export function getPriceColumns() {
  return [
    {
      column: 'Interiér',
      groups: [
        {
          group: 'Balíčky',
          items: SERVICES.interior.packages.map((p) => ({ id: p.id, name: p.name, defaultPrice: p.price })),
        },
        {
          group: 'Příplatky',
          items: SERVICES.interior.packages.flatMap((p) =>
            (p.addons ?? []).map((a) => ({ id: a.id, name: `${p.name}: ${a.name}`, defaultPrice: a.price }))
          ),
        },
        {
          group: 'Extra služby',
          items: SERVICES.interior.extras.map((e) => ({ id: e.id, name: e.name, defaultPrice: e.price, unit: e.unit })),
        },
      ],
    },
    {
      column: 'Exteriér',
      groups: [
        {
          group: 'Balíčky',
          items: SERVICES.exterior.packages.map((p) => ({ id: p.id, name: p.name, defaultPrice: p.price })),
        },
        {
          group: 'Příplatky',
          items: SERVICES.exterior.packages.flatMap((p) =>
            (p.addons ?? []).map((a) => ({ id: a.id, name: `${p.name}: ${a.name}`, defaultPrice: a.price }))
          ),
        },
        {
          group: 'Extra služby',
          items: SERVICES.exterior.extras.map((e) => ({ id: e.id, name: e.name, defaultPrice: e.price })),
        },
      ],
    },
    {
      column: 'Čalounění',
      groups: [
        {
          group: 'Textil',
          items: SERVICES.upholstery.fabric.map((i) => ({ id: i.id, name: i.name, defaultPrice: i.price })),
        },
        {
          group: 'Kůže',
          items: SERVICES.upholstery.leather.map((i) => ({ id: i.id, name: i.name, defaultPrice: i.price })),
        },
      ],
    },
  ];
}

// Flat list used for initialising price state (all items across all columns)
export function getAllPriceItems() {
  return getPriceColumns().flatMap((col) =>
    col.groups.flatMap((g) => g.items)
  );
}
