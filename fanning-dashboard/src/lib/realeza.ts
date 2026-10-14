// La Realeza del proyecto (ver Reglas 5, 7 y 8). Los rangos superiores van aparte:
// una persona aparece en un solo grupo.
export interface GrupoRealeza {
  id: 'supremos' | 'platonicos' | 'reinas' | 'reyes';
  nombre: string;
  descripcion: string;
  miembros: string[];
}

export const REALEZA: GrupoRealeza[] = [
  {
    id: 'supremos',
    nombre: 'Reyes Supremos',
    descripcion: 'El rango más alto entre los reyes.',
    miembros: ['Liam Neeson', 'Colman Domingo', 'Michael Jackson'],
  },
  {
    id: 'platonicos',
    nombre: 'Amores Platónicos',
    descripcion: 'El rango más alto entre las reinas.',
    miembros: ['Taylor Swift', 'Margot Robbie', 'Anya Taylor-Joy', 'Dakota Fanning', 'Elle Fanning'],
  },
  {
    id: 'reinas',
    nombre: 'Reinas',
    descripcion: '',
    miembros: [
      'Meghan Trainor', 'Olivia Rodrigo', 'Lana del Rey', 'Sabrina Carpenter', 'Hunter Schafer',
      'Margaret Qualley', 'Emma Myers', 'Hayley Williams', 'Aurora Aksnes', 'Maude Apatow',
      'Thomasin McKenzie', 'Elizabeth Lail', 'Francisca Valenzuela', 'Kristen Stewart', 'Ava Michelle',
      'Michelle Pfeiffer', 'Zendaya', 'Alexa Demie', 'Sofia Jakobsson', 'Kosovare Asllani',
      'Christy Carlson Romano',
    ],
  },
  {
    id: 'reyes',
    nombre: 'Reyes',
    descripcion: '',
    miembros: [
      'Ewan McGregor', 'Cillian Murphy', 'Marco Antonio Solís', 'Luis Miguel', 'Eminem',
      'Samuel L. Jackson', 'James Hetfield', 'iShowSpeed', 'Álvaro Salas', 'Rick Astley',
      'Gustavo Cerati', 'Robert Pattinson', 'Taylor Lautner', 'Peter Facinelli', 'Angus Cloud',
      'Adewale Akinnuoye-Agbaje', 'Darrell Britt-Gibson', 'Will Friedle',
    ],
  },
];
