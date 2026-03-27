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
    comingSoon: true,
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
