const fs = require('fs');

const manifestPath = 'public/data/manifest.json';
const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const movies2027 = [
  "Twilight",
  "The Twilight Saga: New Moon",
  "The Twilight Saga: Eclipse",
  "The Twilight Saga: Breaking Dawn - Part 1",
  "The Twilight Saga: Breaking Dawn - Part 2",
  "The Big Bang Theory (6, 7 y 8 Temporadas)",
  "Euphoria (3 Temporada)",
  "The Amazing Digital Circus",
  "Kick Buttowski",
  "A Good Girl's Guide to Murder (1 Temporada)",
  "Margo's Got Money Troubles (1 Temporada)",
  "Taylor Swift: The End of an Era",
  "The First Lady",
  "The Great",
  "Taylor Swift: Speak Now World Tour Film",
  "Meghan Trainor with Dr. Phil",
  "Wuthering Heights",
  "The Drama (2026)",
  "Mother Mary (2026)",
  "Countdown",
  "Mack & Rita",
  "Eileen",
  "Lost Girls",
  "Girl in the Basement",
  "A Taste of Christmas",
  "Assassination Nation",
  "Oh What Fun",
  "The Short History of the Long Road",
  "The Hate U Give",
  "My Salinger Year",
  "Seberg",
  "Mary Shelley",
  "How to Talk to Girls at Parties",
  "Trumbo",
  "Live by Night",
  "Young Ones",
  "I Am Sam",
  "The Secret Life of Bees",
  "The Last of Robin Hood",
  "The Ice Road: Vengeance",
  "Cold Pursuit",
  "Unknown",
  "Made in Italy",
  "GTA San Andreas Dialogues Part I (In the Beginning - Mike Toreno)",
  "GTA San Andreas Dialogues Part II (Outrider - End of the Line)",
  "GTA San Andreas Commercials",
  "GTA San Andreas WCTR Radio",
  "The Amazing Digital Circus: The Last Act",
  "Zootopia II (2025)",
  "Pulp Fiction",
  "Matilda (1996)",
  "Lilo and Stitch II: Stitch Has a Glitch",
  "Stitch: The Movie",
  "Back to the Future I",
  "Toy Story 5"
];

const movieList = movies2027.map(title => ({
  title,
  count: 0,
  dialogues: 0,
  episodes: [{ name: title, count: 0, dialogues: 0 }]
}));

data["2027"] = {
  totalWords: 0,
  uniqueMovies: movies2027.length,
  topWord: { word: "N/A", count: 0, translation: "" },
  topList: [],
  movieList
};

// Also update yearlyData in 'all' or in manifest directly
if (!data.yearlyData) data.yearlyData = [];
if (!data.yearlyData.find(y => y.year === '2027')) {
  data.yearlyData.push({ year: "2027", words: 0, dialogues: 0 });
}

fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2));
console.log("Updated manifest with 2027 data");
