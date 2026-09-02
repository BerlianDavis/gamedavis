// Data Soal Petualangan RPG
// Anda dapat menambah, mengubah, atau menghapus soal di sini dengan mudah!

const QUIZ_QUESTIONS = [
  {
    id: 1,
    title: "Gerbang Pengetahuan I",
    npcName: "Penjaga Gerbang Eldoria",
    story: "Salam petualang! Untuk melewati gerbang ini, buktikan ketajaman pikiranmu!",
    question: "Manakah di antara berikut ini yang merupakan planet terbesar di tata surya kita?",
    options: ["Mars", "Jupiter", "Saturnus", "Bumi"],
    correctIndex: 1,
    explanation: "Jupiter adalah planet terbesar di tata surya kita dengan massa lebih dari dua kali lipat gabungan semua planet lainnya!",
    xpReward: 20,
    xpPenalty: 15
  },
  {
    id: 2,
    title: "Monolit Kristal Kuno",
    npcName: "Roh Kristal Biru",
    story: "Dengarkan bisikan kristal... jika kau ingin menyerap energi magis ini, jawab teka-teki berikut!",
    question: "Gas apakah yang paling banyak terkandung di dalam atmosfer bumi?",
    options: ["Oksigen", "Karbon Dioksida", "Nitrogen", "Hidrogen"],
    correctIndex: 2,
    explanation: "Nitrogen mencakup sekitar 78% dari total atmosfer bumi, disusul oleh oksigen sekitar 21%.",
    xpReward: 20,
    xpPenalty: 15
  },
  {
    id: 3,
    title: "Pustaka Pohon Ajaib",
    npcName: "Kakek Pohon Bijak",
    story: "Hohoho... petualang muda yang bersemangat. Ujilah pengetahuan sejarahmu!",
    question: "Candi Borobudur yang megah di Indonesia dibangun oleh dinasti apa?",
    options: ["Dinasti Syailendra", "Dinasti Sanjaya", "Dinasti Majapahit", "Dinasti Singasari"],
    correctIndex: 0,
    explanation: "Candi Borobudur dibangun pada masa kejayaan Dinasti Syailendra sekitar abad ke-8 hingga ke-9 Masehi.",
    xpReward: 25,
    xpPenalty: 20
  },
  {
    id: 4,
    title: "Menara Alkemis Bayangan",
    npcName: "Penyihir Alkemis",
    story: "Eksperimen ramuanku membutuhkan ketelitian logika. Coba pecahkan kode ini!",
    question: "Jika sebuah segitiga memiliki sudut 90 derajat dan 45 derajat, berapa besar sudut ketiganya?",
    options: ["35 Derajat", "45 Derajat", "60 Derajat", "90 Derajat"],
    correctIndex: 1,
    explanation: "Jumlah total sudut segitiga selalu 180 derajat. (180 - 90 - 45 = 45 derajat).",
    xpReward: 25,
    xpPenalty: 20
  },
  {
    id: 5,
    title: "Altar Sang Naga Perak",
    npcName: "Naga Penjaga Pusaka",
    story: "Kau telah melangkah sejauh ini. Jawab pertanyaan terakhirku untuk membuka Gerbang Kemenangan!",
    question: "Apakah nama organ dalam tubuh manusia yang berfungsi memompa darah ke seluruh tubuh?",
    options: ["Paru-paru", "Hati", "Jantung", "Ginjal"],
    correctIndex: 2,
    explanation: "Jantung bertindak sebagai pompa berotot yang mengedarkan darah beroksigen ke seluruh jaringan tubuh manusia.",
    xpReward: 30,
    xpPenalty: 25
  }
];
