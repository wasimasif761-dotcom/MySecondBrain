import { MemoryItem } from '../types';
import { getEmbedding } from './embeddings';
import { getAllMemories, saveMemoriesBulk } from './db';

export const INITIAL_KNOWLEDGE_FACTS = [
  {
    title: 'Assistant Identity & Creator (وسیم آصف)',
    text: 'MySecondBrain is an offline-first Personal AI Assistant built by Waseem Asif (Feedback: wasimasif761@gmail.com). It functions completely privately in your browser using IndexedDB vector RAG and local intelligence.',
    tags: ['creator', 'author', 'waseem-asif', 'identity', 'about'],
  },
  {
    title: 'تعارف اور تخلیق کار (اردو)',
    text: 'میرا نام MySecondBrain ہے۔ مجھے وسیم آصف (Waseem Asif) نے تیار کیا ہے۔ میرا مقصد صارف کی ذاتی یادداشت، دستاویزات اور معلومات کو انٹرنیٹ کے بغیر محفوظ اور یاد رکھنا ہے۔ وسیم آصف سے رابطہ ای میل wasimasif761@gmail.com ہے۔',
    tags: ['identity', 'urdu', 'waseem-asif', 'creator'],
  },
  {
    title: 'اسلامی آداب و سلام',
    text: 'اسلام میں سلام کا جواب: جب کوئی "السلام علیکم" کہے تو جواب میں محبت اور احترام سے "وعلیکم السلام ورحمۃ اللہ وبرکاتہ" کہا جاتا ہے۔ خیر خیریت پوچھنے پر "الحمدللہ میں بالکل ٹھیک ہوں، آپ فرمائیں" کہنا مسنون اور پسندیدہ طریقہ ہے۔',
    tags: ['islam', 'salam', 'urdu', 'adab'],
  },
  {
    title: 'پاکستان کی تاریخ اور بانیان',
    text: 'پاکستان 14 اگست 1947 (27 رمضان المبارک 1366ھ) کو معرض وجود میں آیا۔ قائد اعظم محمد علی جناح پاکستان کے بانی اور پہلے گورنر جنرل تھے۔ علامہ محمد اقبال نے پاکستان کا تصور پیش کیا تھا۔ پاکستان کا دارالحکومت اسلام آباد ہے اور سب سے بڑا شہر کراچی ہے۔',
    tags: ['pakistan', 'history', 'quaid-e-azam', 'iqbal'],
  },
  {
    title: 'سیکنڈ برین کا طریقہ کار (Second Brain)',
    text: 'سیکنڈ برین (Second Brain) ایک ڈیجیٹل نالج والٹ ہے جس میں آپ روزمرہ کی اہم معلومات، پڑھائی کے نوٹس، ویب سے حاصل کردہ حقائق اور پی ڈی ایف دستاویزات کو ویکٹر ڈیٹا بیس میں محفوظ کرتے ہیں تاکہ آپ کو کبھی کچھ بھولے نہیں۔',
    tags: ['second-brain', 'productivity', 'pwa', 'notes'],
  },
  {
    title: 'مصنوعی ذہانت اور مشین لرننگ',
    text: 'مصنوعی ذہانت (Artificial Intelligence / AI) کمپیوٹر سائنس کا وہ شعبہ ہے جس میں کمپیوٹر الگورتھمز انسانی ذہانت کی طرح سیکھنے، زبان سمجھنے، اور فیصلے کرنے کی صلاحیت رکھتے ہیں۔ لارج لینگویج ماڈلز (LLMs) نیورل نیٹ ورکس کے ذریعے کلام اور معلومات پیدا کرتے ہیں۔',
    tags: ['ai', 'technology', 'llm', 'science'],
  },
  {
    title: 'کوانٹم فزکس اور کمپیوٹنگ',
    text: 'کوانٹم کمپیوٹنگ طبیعیات کے کوانٹم مکینکس کے اصولوں (Superposition اور Entanglement) پر انحصار کرتی ہے۔ روایتی کمپیوٹر بٹس (0 یا 1) کے برعکس، کوانٹم کمپیوٹر کیوبٹس (Qubits) کا استعمال کرتے ہیں جو بیک وقت متعدد حالتوں میں ہو سکتے ہیں، جس سے انتہائی پیچیدہ حسابی مسائل پلک جھپکتے حل ہو سکتے ہیں۔',
    tags: ['quantum-computing', 'physics', 'science'],
  },
  {
    title: 'نظام شمسی اور کائنات',
    text: 'ہمارا نظام شمسی ملکی وے (Milky Way) کہکشاں میں واقع ہے۔ اس کا مرکز سورج ہے، جس کے گرد آٹھ سیارے گردش کرتے ہیں: عطارد (Mercury)، زہرہ (Venus)، زمین (Earth)، مریخ (Mars)، مشتری (Jupiter)، زحل (Saturn)، یورینس (Uranus)، اور نیپچون (Neptune)۔ زمین واحد سیارہ ہے جہاں زندگی پائی جاتی ہے۔',
    tags: ['solar-system', 'astronomy', 'earth', 'space'],
  },
];

// Initialize seed knowledge into IndexedDB if vault is empty
export async function seedInitialKnowledgeIfEmpty(): Promise<boolean> {
  try {
    const existing = await getAllMemories();
    if (existing.length > 0) {
      return false; // already has data
    }

    console.log('[Seed] Initializing curated pre-trained knowledge base...');
    const seedItems: MemoryItem[] = [];

    for (let i = 0; i < INITIAL_KNOWLEDGE_FACTS.length; i++) {
      const fact = INITIAL_KNOWLEDGE_FACTS[i];
      const embedding = await getEmbedding(fact.text);
      seedItems.push({
        id: `seed_${i}_${Date.now()}`,
        text: `[${fact.title}]\n${fact.text}`,
        embedding,
        source: 'manual',
        timestamp: Date.now() - (INITIAL_KNOWLEDGE_FACTS.length - i) * 60000,
        metadata: {
          docTitle: fact.title,
          tags: fact.tags,
        },
      });
    }

    await saveMemoriesBulk(seedItems);
    console.log(`[Seed] Seeded ${seedItems.length} foundational memories into IndexedDB.`);
    return true;
  } catch (err) {
    console.warn('[Seed] Seed initialization warning:', err);
    return false;
  }
}
