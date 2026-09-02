// Data Soal Petualangan RPG
// Anda dapat menambah, mengubah, atau menghapus soal di sini dengan mudah!

const QUIZ_QUESTIONS = [
  {
    id: 1,
    title: "Gerbang Pengetahuan I",
    npcName: "Penjaga Gerbang Figma",
    story: "Salam petualang! Untuk bertemu King Davis harus melewati gerbang ini, buktikan ketajaman pikiranmu!",
    question: "Perhatikan pernyataan berikut: Fokus utamanya adalah menyusun kerangka, tata letak, dan alur halaman secara sederhana tanpa memikirkan warna maupun detail visual. Karakteristik tersebut merupakan tahapan perancangan...",
    options: ["High-Fidelity", "Low-Fidelity", "Auto Layout", "Interactive Components"],
    correctIndex: 1,
    explanation: "Ingat kalau membangung rumah tahap perancangan sama dengan tahap Low-Fidelity",
    xpReward: 20,
    xpPenalty: 15
  },
  {
    id: 2,
    title: "Ruangan yang Gelap",
    npcName: "Roh Kristal Biru",
    story: "Simak baik baik... jika kau ingin menyerap energi magis ini, jawab teka-teki berikut!",
    question: "Tahap di mana desain antarmuka mulai diberikan warna asli, tipografi yang rapi, gambar beresolusi tinggi, hingga bayangan (drop shadow) sehingga tampak seperti aplikasi sungguhan disebut...",
    options: ["Low-Fidelity", "High-Fidelity", "Wireframe", "Grayscale Layout"],
    correctIndex: 1,
    explanation: "Jangan sampai terbalik, kalau sudah ditahap warna dan kompleks desainmu berarti masuk ke tahap High-Fidelity ya....",
    xpReward: 20,
    xpPenalty: 15
  },
  {
    id: 3,
    title: "Pustaka Pohon Ajaib",
    npcName: "Kakek Pohon Bijak",
    story: "Hohoho... petualang muda yang bersemangat. Ujilah ingatanmu!",
    question: "Shortcut keyboard yang digunakan untuk mengaktifkan fitur Auto Layout pada sebuah elemen di Figma adalah...",
    options: ["Ctrl + G", "CTRL + A + K", "Shift + A", "Alt + Drag"],
    correctIndex: 2,
    explanation: "Kakek punya ilmu, jadi ingat ya kalau kepanjangan dari A adalah Auto",
    xpReward: 25,
    xpPenalty: 20
  },
  {
    id: 4,
    title: "Menara Alkemis Bayangan",
    npcName: "Penyihir Alkemis",
    story: "Eksperimen ramuanku membutuhkan ingatan yang kuat. Coba pecahkan soal ini!",
    question: "Kondisi (state) dalam desain antarmuka ketika kursor mouse pengguna diletakkan tepat di atas sebuah tombol namun belum diklik disebut dengan efek...",
    options: ["Pressed", "Disabled", "Focused", "Hover"],
    correctIndex: 3,
    explanation: "Hover berarti menghandover berarti istilah lain memindahkan secara tidak langsung",
    xpReward: 25,
    xpPenalty: 20
  },
  {
    id: 5,
    title: "Altar Sang Naga Puncak",
    npcName: "Naga Penjaga Pusaka",
    story: "Kau telah melangkah sejauh ini. Jawab pertanyaan terakhirku untuk bertemu King Davis dan menaklukkannya!",
    question: "Setelah sebuah elemen diubah menjadi komponen utama di Figma, fitur yang digunakan untuk membuat wujud kondisi kedua (misalnya tombol dengan warna lebih gelap untuk efek hover) adalah...",
    options: ["Variant", "Instance", "Plugin", "Asset"],
    correctIndex: 0,
    explanation: "Ingat komponen itu menggunakan varian supaya ber variasi ya",
    xpReward: 30,
    xpPenalty: 25
  }
];
