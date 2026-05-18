export const LOOKBOOKS = [
  {
    id: 'fw26',
    season: 'F/W 26',
    title: 'ÉTUDE POUR\nUNE RUINE.',
    titleItalic: 'UNE RUINE.',
    photographer: 'P. ASTIER',
    location: 'RUE DE TURENNE',
    totalLooks: 27,
    looks: [
      {
        number: 14,
        photoId: 3,
        items: [
          { name: 'WOOL TOPCOAT "LE FUNESTE"', price: 4200, productId: 'p003' },
          { name: 'SILK SCARF "MÉMOIRE"', price: 380, productId: 'p004' },
          { name: 'DISTRESSED TROUSER', price: 1140, productId: 'p008' },
        ],
      },
      {
        number: 7,
        photoId: 0,
        items: [
          { name: 'PAINTER\'S SMOCK', price: 1480, productId: 'p007' },
          { name: 'DOWN SYNDROME ALEPH BABY TEE', price: 1150, productId: 'p001' },
        ],
      },
    ],
  },
  {
    id: 'ss26',
    season: 'S/S 26',
    title: 'COLLECTION\nDE MÉMOIRE.',
    titleItalic: 'DE MÉMOIRE.',
    photographer: 'E. BAUDELAIRE',
    location: 'PALAIS ROYAL',
    totalLooks: 22,
    looks: [
      {
        number: 1,
        photoId: 4,
        items: [
          { name: 'MOHAIR CARDIGAN', price: 2200, productId: 'p006' },
          { name: 'SILK SCARF "MÉMOIRE"', price: 380, productId: 'p004' },
        ],
      },
    ],
  },
];

export function getLookbook(id) {
  return LOOKBOOKS.find(l => l.id === id) ?? null;
}
