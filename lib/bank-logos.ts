/**
 * Comprehensive Philippine Banks & E-Wallets Catalog & Logo API
 * Covers all BSP-supervised Universal, Commercial, Digital, Thrift, Rural banks,
 * EMIs (E-Wallets), and international payment channels.
 */

export type BankCategory =
  | 'e-wallet'
  | 'digital-bank'
  | 'universal-bank'
  | 'commercial-bank'
  | 'thrift-bank'
  | 'international';

export interface BankBrandInfo {
  name: string;
  shortName?: string;
  aliases: string[];
  domain: string;
  color: string;
  category: BankCategory;
  description?: string;
}

export const PH_BANK_BRANDS: BankBrandInfo[] = [
  // ==========================================
  // 1. E-WALLETS & MOBILE MONEY (EMIs)
  // ==========================================
  {
    name: 'GCash',
    shortName: 'GCash',
    aliases: ['gcash', 'mynt', 'globe fintech', 'g-cash', 'gxchange'],
    domain: 'gcash.com',
    color: '#007DFE',
    category: 'e-wallet',
    description: 'Leading mobile wallet in the Philippines',
  },
  {
    name: 'Maya',
    shortName: 'Maya',
    aliases: ['maya', 'paymaya', 'pay maya', 'maya wallet', 'maya ph'],
    domain: 'maya.ph',
    color: '#1FBF6B',
    category: 'e-wallet',
    description: 'All-in-one digital wallet & banking app',
  },
  {
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    aliases: ['shopeepay', 'shopee pay', 'shopee'],
    domain: 'shopee.ph',
    color: '#EE4D2D',
    category: 'e-wallet',
    description: 'Shopee integrated digital wallet',
  },
  {
    name: 'GrabPay',
    shortName: 'GrabPay',
    aliases: ['grabpay', 'grab pay', 'grab', 'grab wallet'],
    domain: 'grab.com',
    color: '#00A651',
    category: 'e-wallet',
    description: 'Grab superapp e-wallet',
  },
  {
    name: 'Coins.ph',
    shortName: 'Coins.ph',
    aliases: ['coins', 'coins.ph', 'coinsph', 'dcit solutions'],
    domain: 'coins.ph',
    color: '#1B64F2',
    category: 'e-wallet',
    description: 'Crypto and fiat digital wallet',
  },
  {
    name: 'PalawanPay',
    shortName: 'PalawanPay',
    aliases: ['palawanpay', 'palawan pay', 'palawan pawnshop', 'palawan express'],
    domain: 'palawanpay.com',
    color: '#006837',
    category: 'e-wallet',
    description: 'Palawan Pawnshop digital wallet',
  },
  {
    name: 'Lazada Wallet',
    shortName: 'Lazada',
    aliases: ['lazada', 'lazada wallet', 'lazpay'],
    domain: 'lazada.com.ph',
    color: '#0F146D',
    category: 'e-wallet',
    description: 'Lazada integrated e-wallet',
  },
  {
    name: 'Bayad',
    shortName: 'Bayad',
    aliases: ['bayad', 'bayad app', 'bayad center', 'cis bayad'],
    domain: 'bayad.com',
    color: '#004F9E',
    category: 'e-wallet',
    description: 'Bills payment and financial services wallet',
  },
  {
    name: 'Cliqq',
    shortName: '7-Eleven Cliqq',
    aliases: ['cliqq', 'cliqq app', '7-eleven', '7 eleven', 'seven eleven'],
    domain: 'cliqq.net',
    color: '#00805E',
    category: 'e-wallet',
    description: '7-Eleven Philippines mobile wallet',
  },
  {
    name: 'StarPay',
    shortName: 'StarPay',
    aliases: ['starpay', 'star pay', 'starpay corporation'],
    domain: 'starpay.com.ph',
    color: '#F7941D',
    category: 'e-wallet',
    description: 'Licensed e-wallet for government and retail payments',
  },
  {
    name: 'JuanCash',
    shortName: 'JuanCash',
    aliases: ['juancash', 'juan cash', 'zybi tech'],
    domain: 'juancash.com',
    color: '#00A859',
    category: 'e-wallet',
    description: 'Mobile wallet with cross-border capabilities',
  },
  {
    name: 'Tala',
    shortName: 'Tala',
    aliases: ['tala', 'tala wallet', 'tala ph'],
    domain: 'tala.ph',
    color: '#00A699',
    category: 'e-wallet',
    description: 'Financial app and wallet for micro-loans',
  },
  {
    name: 'BillEase',
    shortName: 'BillEase',
    aliases: ['billease', 'bill ease', 'first digital finance'],
    domain: 'billease.ph',
    color: '#0052FF',
    category: 'e-wallet',
    description: 'BNPL and digital credit wallet',
  },
  {
    name: 'PayMongo',
    shortName: 'PayMongo',
    aliases: ['paymongo', 'pay mongo'],
    domain: 'paymongo.com',
    color: '#6C5CE7',
    category: 'e-wallet',
    description: 'Online payment gateway & merchant wallet',
  },
  {
    name: 'OmniPay',
    shortName: 'OmniPay',
    aliases: ['omnipay', 'omni pay'],
    domain: 'omnipay.asia',
    color: '#005B94',
    category: 'e-wallet',
    description: 'Prepaid card and EMI provider',
  },

  // ==========================================
  // 2. DIGITAL BANKS (BSP Licensed)
  // ==========================================
  {
    name: 'GoTyme Bank',
    shortName: 'GoTyme',
    aliases: ['gotyme', 'gotyme bank', 'go tyme', 'tyme bank', 'robinsons gotyme'],
    domain: 'gotyme.com.ph',
    color: '#00A6A0',
    category: 'digital-bank',
    description: 'Gokongwei Group & Tyme digital bank',
  },
  {
    name: 'Maya Bank',
    shortName: 'Maya Bank',
    aliases: ['maya bank', 'mayabank', 'maya savings', 'maya credit'],
    domain: 'mayabank.ph',
    color: '#1FBF6B',
    category: 'digital-bank',
    description: 'Licensed digital bank by Maya',
  },
  {
    name: 'SeaBank',
    shortName: 'SeaBank',
    aliases: ['seabank', 'sea bank', 'seamoney', 'shopee bank', 'seabank philippines'],
    domain: 'seabank.com.ph',
    color: '#FF5722',
    category: 'digital-bank',
    description: 'SeaMoney & Shopee mobile digital banking',
  },
  {
    name: 'MariBank',
    shortName: 'MariBank',
    aliases: ['maribank', 'mari bank', 'maribank ph', 'sea maribank', 'maribank shopee'],
    domain: 'maribank.ph',
    color: '#FF5722',
    category: 'digital-bank',
    description: 'Digital bank by Sea Limited',
  },
  {
    name: 'Tonik Bank',
    shortName: 'Tonik',
    aliases: ['tonik', 'tonik bank', 'tonik digital bank'],
    domain: 'tonikbank.com',
    color: '#7000FF',
    category: 'digital-bank',
    description: 'First pure-play digital neobank in the PH',
  },
  {
    name: 'UnionDigital Bank',
    shortName: 'UnionDigital',
    aliases: ['uniondigital', 'union digital', 'uniondigital bank', 'udb'],
    domain: 'uniondigitalbank.io',
    color: '#FF6A00',
    category: 'digital-bank',
    description: 'Digital banking entity of UnionBank',
  },
  {
    name: 'UNO Digital Bank',
    shortName: 'UNOBank',
    aliases: ['unobank', 'uno digital bank', 'uno bank', 'unobank.asia'],
    domain: 'unobank.asia',
    color: '#582CD2',
    category: 'digital-bank',
    description: 'Full-spectrum credit-led digital bank',
  },
  {
    name: 'CIMB Bank',
    shortName: 'CIMB',
    aliases: ['cimb', 'cimb bank', 'cimb ph', 'cimb bank philippines', 'gcredit cimb'],
    domain: 'cimbbank.com.ph',
    color: '#ED1C24',
    category: 'digital-bank',
    description: 'Pioneer commercial digital bank in the Philippines',
  },
  {
    name: 'Overseas Filipino Bank',
    shortName: 'OFBank',
    aliases: ['ofbank', 'ofb', 'overseas filipino bank', 'landbank ofbank'],
    domain: 'ofb.com.ph',
    color: '#006699',
    category: 'digital-bank',
    description: 'Digital-only bank dedicated to Filipinos abroad',
  },

  // ==========================================
  // 3. UNIVERSAL & COMMERCIAL BANKS
  // ==========================================
  {
    name: 'BDO Unibank',
    shortName: 'BDO',
    aliases: ['bdo', 'bdo unibank', 'banco de oro', 'bdo network bank', 'bdo pay'],
    domain: 'bdo.com.ph',
    color: '#0A3D91',
    category: 'universal-bank',
    description: 'Largest universal bank in the Philippines',
  },
  {
    name: 'BPI',
    shortName: 'BPI',
    aliases: ['bpi', 'bank of the philippine islands', 'bpi family', 'vybe', 'bpi direct'],
    domain: 'bpi.com.ph',
    color: '#B3151B',
    category: 'universal-bank',
    description: 'Oldest bank in the Philippines and Southeast Asia',
  },
  {
    name: 'Metrobank',
    shortName: 'Metrobank',
    aliases: ['metrobank', 'mbt', 'metropolitan bank', 'metropolitan bank and trust company', 'metrobank app'],
    domain: 'metrobank.com.ph',
    color: '#1B3F94',
    category: 'universal-bank',
    description: 'Major premier Philippine universal bank',
  },
  {
    name: 'UnionBank',
    shortName: 'UnionBank',
    aliases: ['unionbank', 'ubp', 'union bank', 'union bank of the philippines', 'unionbank online', 'citi'],
    domain: 'unionbankph.com',
    color: '#F26B21',
    category: 'universal-bank',
    description: 'Pioneer in digital transformation & online banking',
  },
  {
    name: 'Landbank',
    shortName: 'Landbank',
    aliases: ['landbank', 'lbp', 'land bank', 'land bank of the philippines', 'landbank mobile'],
    domain: 'landbank.com',
    color: '#0B7A3E',
    category: 'universal-bank',
    description: 'Government financial institution serving agriculture and development',
  },
  {
    name: 'Security Bank',
    shortName: 'Security Bank',
    aliases: ['security bank', 'secb', 'security bank corp', 'betterbanking', 'sb online'],
    domain: 'securitybank.com',
    color: '#0066B2',
    category: 'universal-bank',
    description: 'Award-winning universal bank for retail and business',
  },
  {
    name: 'RCBC',
    shortName: 'RCBC',
    aliases: ['rcbc', 'rizal commercial banking corp', 'rcbc pulz', 'pulz', 'diskartech', 'rcbc bank'],
    domain: 'rcbc.com',
    color: '#005596',
    category: 'universal-bank',
    description: 'Yuchengco Group universal bank and DiskarTech operator',
  },
  {
    name: 'PNB',
    shortName: 'PNB',
    aliases: ['pnb', 'philippine national bank', 'pnb digital', 'lucio tan bank'],
    domain: 'pnb.com.ph',
    color: '#003366',
    category: 'universal-bank',
    description: 'Historic universal bank with extensive global branch network',
  },
  {
    name: 'China Bank',
    shortName: 'China Bank',
    aliases: ['china bank', 'chinabank', 'cbc', 'china banking corporation', 'chinabank digital'],
    domain: 'chinabank.ph',
    color: '#8A1538',
    category: 'universal-bank',
    description: 'First privately owned commercial bank in the Philippines',
  },
  {
    name: 'EastWest Bank',
    shortName: 'EastWest',
    aliases: ['eastwest', 'eastwest bank', 'ewb', 'east west banking corporation', 'komo'],
    domain: 'eastwestbanker.com',
    color: '#4B286D',
    category: 'universal-bank',
    description: 'Filinvest Group full-service commercial bank',
  },
  {
    name: 'DBP',
    shortName: 'DBP',
    aliases: ['dbp', 'development bank of the philippines', 'dbp digital'],
    domain: 'dbp.ph',
    color: '#003A70',
    category: 'universal-bank',
    description: 'Key state-owned infrastructure and development bank',
  },
  {
    name: 'Bank of Commerce',
    shortName: 'BankCom',
    aliases: ['bank of commerce', 'bankcom', 'boc', 'san miguel bank'],
    domain: 'bankcom.com.ph',
    color: '#E31B23',
    category: 'commercial-bank',
    description: 'San Miguel Corporation affiliate commercial bank',
  },
  {
    name: 'Asia United Bank',
    shortName: 'AUB',
    aliases: ['aub', 'asia united bank', 'aub paymate', 'hello money'],
    domain: 'aub.com.ph',
    color: '#003366',
    category: 'universal-bank',
    description: 'Innovative digital-forward commercial bank',
  },
  {
    name: 'PBCom',
    shortName: 'PBCom',
    aliases: ['pbcom', 'philippine bank of communications', 'pbcom mobile', 'puregold bank'],
    domain: 'pbcom.com.ph',
    color: '#C4122F',
    category: 'commercial-bank',
    description: 'Lucio Co / Puregold group commercial bank',
  },
  {
    name: 'Philtrust Bank',
    shortName: 'Philtrust',
    aliases: ['philtrust', 'philtrust bank', 'philippine trust company'],
    domain: 'philtrustbank.com',
    color: '#004F98',
    category: 'commercial-bank',
    description: 'Historic commercial bank established in 1916',
  },
  {
    name: 'Maybank Philippines',
    shortName: 'Maybank',
    aliases: ['maybank', 'maybank philippines', 'maybank ph', 'maybank2u'],
    domain: 'maybank.com.ph',
    color: '#FFC800',
    category: 'commercial-bank',
    description: 'ASEAN financial powerhouse Philippines subsidiary',
  },
  {
    name: 'CTBC Bank',
    shortName: 'CTBC',
    aliases: ['ctbc', 'ctbc bank', 'ctbc bank philippines', 'chinatrust'],
    domain: 'ctbcbank.com.ph',
    color: '#007D43',
    category: 'commercial-bank',
    description: 'Commercial bank and subsidiary of CTBC Financial Holding',
  },
  {
    name: 'Standard Chartered Bank',
    shortName: 'StanChart',
    aliases: ['standard chartered', 'stanchart', 'scb ph', 'standard chartered philippines'],
    domain: 'sc.com',
    color: '#007AC0',
    category: 'universal-bank',
    description: 'Oldest international bank in the Philippines',
  },
  {
    name: 'HSBC Philippines',
    shortName: 'HSBC',
    aliases: ['hsbc', 'hsbc philippines', 'hongkong and shanghai banking corp'],
    domain: 'hsbc.com.ph',
    color: '#DB0011',
    category: 'universal-bank',
    description: 'Leading international universal banking institution',
  },
  {
    name: 'Robinsons Bank',
    shortName: 'Robinsons Bank',
    aliases: ['robinsons bank', 'rbank', 'robinsons banking corp', 'rplace'],
    domain: 'robinsonsbank.com.ph',
    color: '#005CA9',
    category: 'commercial-bank',
    description: 'JG Summit / BPI partner commercial bank',
  },
  {
    name: 'Al-Amanah Islamic Bank',
    shortName: 'Al-Amanah',
    aliases: ['al amanah', 'al-amanah', 'islamic bank', 'al-amanah islamic investment bank'],
    domain: 'al-amanahbank.com',
    color: '#006B3F',
    category: 'universal-bank',
    description: 'Only Islamic banking institution in the Philippines',
  },

  // ==========================================
  // 4. THRIFT, SAVINGS & RURAL BANKS
  // ==========================================
  {
    name: 'PSBank',
    shortName: 'PSBank',
    aliases: ['psbank', 'ps bank', 'philippine savings bank', 'metrobank psbank'],
    domain: 'psbank.com.ph',
    color: '#004A99',
    category: 'thrift-bank',
    description: 'Metrobank Group consumer and thrift banking arm',
  },
  {
    name: 'CitySavings Bank',
    shortName: 'CitySavings',
    aliases: ['citysavings', 'city savings', 'city savings bank', 'unionbank citysavings'],
    domain: 'citysavings.com.ph',
    color: '#EE3124',
    category: 'thrift-bank',
    description: 'Thrift bank subsidiary of UnionBank',
  },
  {
    name: 'BPI Direct BanKo',
    shortName: 'BanKo',
    aliases: ['banko', 'bpi banko', 'bpi direct banko', 'ban ko'],
    domain: 'banko.com.ph',
    color: '#A01A22',
    category: 'thrift-bank',
    description: 'Microfinance and savings arm of BPI',
  },
  {
    name: 'Sterling Bank of Asia',
    shortName: 'Sterling Bank',
    aliases: ['sterling bank', 'sterling bank of asia', 'sterling savings'],
    domain: 'sterlingbankasia.com',
    color: '#005A9C',
    category: 'thrift-bank',
    description: 'Savings and thrift banking institution',
  },
  {
    name: 'Wealth Development Bank',
    shortName: 'WealthBank',
    aliases: ['wealth bank', 'wealth development bank', 'wealthbank'],
    domain: 'wealthbank.com.ph',
    color: '#D12027',
    category: 'thrift-bank',
    description: 'Leading thrift bank in Visayas and Mindanao',
  },
  {
    name: 'Philippine Business Bank',
    shortName: 'PBB',
    aliases: ['pbb', 'philippine business bank', 'pbb digital'],
    domain: 'pbb.com.ph',
    color: '#003D79',
    category: 'thrift-bank',
    description: 'SME-focused thrift bank',
  },
  {
    name: 'Producers Savings Bank',
    shortName: 'Producers Bank',
    aliases: ['producers bank', 'producers savings bank', 'producers'],
    domain: 'producersbank.com.ph',
    color: '#00733E',
    category: 'thrift-bank',
    description: 'Agricultural and commercial savings bank',
  },
  {
    name: 'CARD Bank',
    shortName: 'CARD Bank',
    aliases: ['card bank', 'card sme bank', 'card mutually reinforcing', 'card inc'],
    domain: 'cardbankph.com',
    color: '#006837',
    category: 'thrift-bank',
    description: 'Microfinance-oriented rural and thrift bank',
  },
  {
    name: 'AllBank',
    shortName: 'AllBank',
    aliases: ['allbank', 'all bank', 'alliance bank', 'villar bank'],
    domain: 'allbank.ph',
    color: '#E31B23',
    category: 'thrift-bank',
    description: 'Thrift bank for retail and Villar group ecosystems',
  },
  {
    name: 'Malayan Bank',
    shortName: 'Malayan Bank',
    aliases: ['malayan bank', 'malayan savings bank'],
    domain: 'malayanbank.com',
    color: '#1C3F94',
    category: 'thrift-bank',
    description: 'Savings bank serving consumers and SMEs',
  },
  {
    name: 'Bank of Makati',
    shortName: 'BMI',
    aliases: ['bank of makati', 'bmi', 'makati bank', 'motortrade bank'],
    domain: 'bankofmakati.com.ph',
    color: '#D62027',
    category: 'thrift-bank',
    description: 'Leading motorcycle and consumer loan savings bank',
  },
  {
    name: '1st Valley Bank',
    shortName: '1st Valley',
    aliases: ['1st valley bank', 'first valley bank', '1vb'],
    domain: '1stvalleybank.com',
    color: '#005DAA',
    category: 'thrift-bank',
    description: 'Rural and development bank across Mindanao and Visayas',
  },
  {
    name: 'Luzon Development Bank',
    shortName: 'LDB',
    aliases: ['ldb', 'luzon development bank'],
    domain: 'ldb.com.ph',
    color: '#004B87',
    category: 'thrift-bank',
    description: 'Thrift bank operating in Luzon and NCR',
  },
  {
    name: 'Sun Savings Bank',
    shortName: 'Sun Savings',
    aliases: ['sun savings', 'sun savings bank'],
    domain: 'sunsavings.com',
    color: '#FDB913',
    category: 'thrift-bank',
    description: 'Cebu-based savings and digital credit bank',
  },
  {
    name: 'Queenbank',
    shortName: 'Queenbank',
    aliases: ['queenbank', 'queen city development bank', 'qcdb'],
    domain: 'queenbank.com.ph',
    color: '#003A70',
    category: 'thrift-bank',
    description: 'Private development bank in Western Visayas',
  },
  {
    name: 'Legazpi Savings Bank',
    shortName: 'Legazpi Savings',
    aliases: ['legazpi savings', 'legazpi savings bank', 'lsb', 'robinsons lsb'],
    domain: 'legazpisavings.com',
    color: '#005B9E',
    category: 'thrift-bank',
    description: 'Bicol region thrift bank affiliate of Robinsons Bank',
  },
  {
    name: 'Yuanta Savings Bank',
    shortName: 'Yuanta',
    aliases: ['yuanta', 'yuanta savings', 'yuanta savings bank philippines', 'tongyang'],
    domain: 'yuantasavings.com',
    color: '#003B75',
    category: 'thrift-bank',
    description: 'Philippine subsidiary of Taiwan-based Yuanta Financial Group',
  },
  {
    name: 'ISLA Bank',
    shortName: 'ISLA Bank',
    aliases: ['isla bank', 'isla bank a thrift bank', 'isla'],
    domain: 'islabank.com.ph',
    color: '#1E3A8A',
    category: 'thrift-bank',
    description: 'Thrift bank serving Luzon communities',
  },

  // ==========================================
  // 5. INTERNATIONAL & REMITTANCE CHANNELS
  // ==========================================
  {
    name: 'PayPal',
    shortName: 'PayPal',
    aliases: ['paypal', 'pypl', 'pay pal'],
    domain: 'paypal.com',
    color: '#003087',
    category: 'international',
    description: 'Global online payments and transfers',
  },
  {
    name: 'Wise',
    shortName: 'Wise',
    aliases: ['wise', 'transferwise', 'wise transfer', 'wise.com'],
    domain: 'wise.com',
    color: '#9FE870',
    category: 'international',
    description: 'Low-cost multi-currency and cross-border money transfer',
  },
  {
    name: 'Western Union',
    shortName: 'Western Union',
    aliases: ['western union', 'wu', 'westernunion', 'wu app'],
    domain: 'westernunion.com',
    color: '#FFDA1A',
    category: 'international',
    description: 'Global money movement and remittance network',
  },
  {
    name: 'Remitly',
    shortName: 'Remitly',
    aliases: ['remitly', 'remitly express'],
    domain: 'remitly.com',
    color: '#1E293B',
    category: 'international',
    description: 'International digital remittance to PH banks & wallets',
  },
  {
    name: 'MoneyGram',
    shortName: 'MoneyGram',
    aliases: ['moneygram', 'money gram'],
    domain: 'moneygram.com',
    color: '#E31B23',
    category: 'international',
    description: 'Global P2P payments and money transfer',
  },
  {
    name: 'WorldRemit',
    shortName: 'WorldRemit',
    aliases: ['worldremit', 'world remit'],
    domain: 'worldremit.com',
    color: '#5C2D91',
    category: 'international',
    description: 'Online money transfers to Philippine banks and wallets',
  },
  {
    name: 'Stripe',
    shortName: 'Stripe',
    aliases: ['stripe', 'stripe payments'],
    domain: 'stripe.com',
    color: '#635BFF',
    category: 'international',
    description: 'Global financial infrastructure & payment processing',
  },
  {
    name: 'Payoneer',
    shortName: 'Payoneer',
    aliases: ['payoneer', 'payoneer ph'],
    domain: 'payoneer.com',
    color: '#FF4800',
    category: 'international',
    description: 'Cross-border payments for freelancers & digital businesses',
  },
  {
    name: 'Revolut',
    shortName: 'Revolut',
    aliases: ['revolut', 'revolut app'],
    domain: 'revolut.com',
    color: '#191C1F',
    category: 'international',
    description: 'Global financial superapp',
  },
];

/**
 * Returns the primary high-resolution logo image URL using Google Favicon API (128x128).
 */
export function getBankLogoUrl(domain: string, size = 128): string {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/**
 * Returns a backup logo image URL using Unavatar API.
 */
export function getBackupLogoUrl(domain: string): string {
  if (!domain) return '';
  return `https://unavatar.io/${encodeURIComponent(domain)}?fallback=false`;
}

/**
 * Normalizes strings for loose and resilient matching.
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Find brand info by exact or fuzzy matching bank name or any known aliases.
 */
export function findBankBrand(name: string): BankBrandInfo | null {
  if (!name || typeof name !== 'string') return null;

  const rawClean = name.trim().toLowerCase();
  const normalized = normalizeString(name);

  if (!normalized) return null;

  // 1. Direct name match
  const directMatch = PH_BANK_BRANDS.find(
    (b) =>
      b.name.toLowerCase() === rawClean ||
      normalizeString(b.name) === normalized ||
      (b.shortName && normalizeString(b.shortName) === normalized)
  );
  if (directMatch) return directMatch;

  // 2. Direct alias match
  const aliasMatch = PH_BANK_BRANDS.find((b) =>
    b.aliases.some((alias) => alias.toLowerCase() === rawClean || normalizeString(alias) === normalized)
  );
  if (aliasMatch) return aliasMatch;

  // 3. Substring inclusion match (e.g. "GCash Account" -> GCash, "BDO Savings" -> BDO)
  const substringMatch = PH_BANK_BRANDS.find((b) => {
    const brandNorm = normalizeString(b.name);
    if (normalized.includes(brandNorm) || brandNorm.includes(normalized)) return true;
    if (b.shortName) {
      const shortNorm = normalizeString(b.shortName);
      if (normalized.includes(shortNorm)) return true;
    }
    return b.aliases.some((alias) => {
      const aNorm = normalizeString(alias);
      return aNorm.length >= 3 && (normalized.includes(aNorm) || aNorm.includes(normalized));
    });
  });

  return substringMatch || null;
}

/**
 * Get the logo URL for any bank name. If matched to a PH bank, returns its official logo API URL.
 */
export function getLogoForProvider(providerName: string, customLogo?: string | null): string | null {
  if (customLogo) return customLogo;
  const brand = findBankBrand(providerName);
  if (brand) {
    return getBankLogoUrl(brand.domain, 128);
  }
  return null;
}

/**
 * Resolves the primary brand color for a provider name, or falls back to a provided color.
 */
export function getBrandColorForProvider(providerName: string, fallbackColor = '#007AFF'): string {
  const brand = findBankBrand(providerName);
  return brand ? brand.color : fallbackColor;
}

/**
 * Search banks by query across names, short names, aliases, and categories.
 */
export function searchBanks(query: string, categoryFilter?: BankCategory | 'all'): BankBrandInfo[] {
  let list = PH_BANK_BRANDS;

  if (categoryFilter && categoryFilter !== 'all') {
    list = list.filter((b) => b.category === categoryFilter);
  }

  if (!query || !query.trim()) {
    return list;
  }

  const normQuery = normalizeString(query);

  return list.filter((b) => {
    if (normalizeString(b.name).includes(normQuery)) return true;
    if (b.shortName && normalizeString(b.shortName).includes(normQuery)) return true;
    if (b.aliases.some((a) => normalizeString(a).includes(normQuery))) return true;
    if (b.description && b.description.toLowerCase().includes(query.toLowerCase().trim())) return true;
    return false;
  });
}

/**
 * Returns human-readable label for a bank category.
 */
export function getCategoryLabel(category: BankCategory): string {
  switch (category) {
    case 'e-wallet':
      return 'E-Wallets & Mobile Money';
    case 'digital-bank':
      return 'Digital Banks';
    case 'universal-bank':
      return 'Universal & Commercial';
    case 'commercial-bank':
      return 'Commercial Banks';
    case 'thrift-bank':
      return 'Thrift & Savings Banks';
    case 'international':
      return 'Remittance & Global';
    default:
      return 'Banks';
  }
}
