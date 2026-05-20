import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'business-cards.json');

export interface PhoneNumber {
  id: string;
  number: string;
  type: 'mobile' | 'work' | 'home' | 'fax' | 'pager' | 'other';
  label?: string;
}

export interface WebLink {
  id: string;
  url: string;
  type: 'website' | 'portfolio' | 'blog' | 'shop' | 'booking' | 'calendar' | 'payment' | 'other';
  label?: string;
}

export interface SocialLink {
  id: string;
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'github' | 'dribbble' | 'behance' | 'pinterest' | 'snapchat' | 'whatsapp' | 'telegram' | 'discord' | 'twitch' | 'spotify' | 'soundcloud' | 'medium' | 'substack' | 'threads' | 'mastodon' | 'bluesky' | 'other';
  username: string;
  url?: string;
}

export interface BusinessCard {
  id: string;
  
  // Personal
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  photo?: string;
  logo?: string;
  
  // Contact - Dynamic arrays
  emails: Array<{ id: string; email: string; type: 'work' | 'personal' | 'other'; label?: string }>;
  phones: PhoneNumber[];
  websites: WebLink[];
  socials: SocialLink[];
  
  // Legacy fields (for backwards compat)
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  
  // Design
  template: string;
  qrShape: string;
  qrColor: string;
  qrBgColor?: string;
  bgColor: string;
  bgImage?: string;
  accentColor: string;
  
  // Advanced color customization
  iconBgColor?: string;      // Icon circle background
  iconColor?: string;        // Icon itself (mail, phone icons)
  sectionBgColor?: string;   // Contact row background
  sectionTitleColor?: string; // "WORK", "MOBILE" labels
  contentColor?: string;     // Email/phone text
  nameColor?: string;        // Name text
  titleColor?: string;       // Position/job title text
  companyColor?: string;     // Company text
  bioColor?: string;         // Bio text
  buttonBgColor?: string;    // Save/Share button background
  buttonTextColor?: string;  // Save/Share button text
  
  // NFC
  nfcEnabled?: boolean;
  nfcTagId?: string;
  
  // Stats
  scanCount: number;
  saveCount: number;
  shareCount: number;
  nfcTapCount: number;
  
  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

async function readData(): Promise<{ cards: BusinessCard[] }> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { cards: [] };
  }
}

async function writeData(data: { cards: BusinessCard[] }): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Phone type to vCard type mapping
const PHONE_TYPE_MAP: Record<string, string> = {
  mobile: 'CELL',
  work: 'WORK,VOICE',
  home: 'HOME,VOICE',
  fax: 'FAX',
  pager: 'PAGER',
  other: 'VOICE',
};

// Social platform URL templates
const SOCIAL_URL_TEMPLATES: Record<string, string> = {
  linkedin: 'https://linkedin.com/in/',
  twitter: 'https://twitter.com/',
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  tiktok: 'https://tiktok.com/@',
  youtube: 'https://youtube.com/@',
  github: 'https://github.com/',
  dribbble: 'https://dribbble.com/',
  behance: 'https://behance.net/',
  pinterest: 'https://pinterest.com/',
  snapchat: 'https://snapchat.com/add/',
  whatsapp: 'https://wa.me/',
  telegram: 'https://t.me/',
  discord: '',
  twitch: 'https://twitch.tv/',
  spotify: 'https://open.spotify.com/user/',
  soundcloud: 'https://soundcloud.com/',
  medium: 'https://medium.com/@',
  substack: 'https://',
  threads: 'https://threads.net/@',
  mastodon: '',
  bluesky: 'https://bsky.app/profile/',
  other: '',
};

// Generate vCard string
export function generateVCard(card: BusinessCard): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.name}`,
  ];
  
  // Name parts (if we want to split)
  const nameParts = card.name.split(' ');
  if (nameParts.length >= 2) {
    lines.push(`N:${nameParts.slice(1).join(' ')};${nameParts[0]};;;`);
  }
  
  if (card.title) {
    lines.push(`TITLE:${card.title}`);
  }
  
  if (card.company) {
    lines.push(`ORG:${card.company}`);
  }
  
  // Dynamic emails
  if (card.emails?.length) {
    card.emails.forEach(e => {
      const type = e.type === 'work' ? 'WORK' : e.type === 'personal' ? 'HOME' : 'OTHER';
      lines.push(`EMAIL;TYPE=${type}:${e.email}`);
    });
  } else if (card.email) {
    // Legacy fallback
    lines.push(`EMAIL;TYPE=WORK:${card.email}`);
  }
  
  // Dynamic phones
  if (card.phones?.length) {
    card.phones.forEach(p => {
      const type = PHONE_TYPE_MAP[p.type] || 'VOICE';
      lines.push(`TEL;TYPE=${type}:${p.number}`);
    });
  } else {
    // Legacy fallback
    if (card.phone) {
      lines.push(`TEL;TYPE=WORK,VOICE:${card.phone}`);
    }
    if (card.mobile) {
      lines.push(`TEL;TYPE=CELL:${card.mobile}`);
    }
  }
  
  // Dynamic websites
  if (card.websites?.length) {
    card.websites.forEach(w => {
      lines.push(`URL:${w.url}`);
    });
  } else if (card.website) {
    // Legacy fallback
    lines.push(`URL:${card.website}`);
  }
  
  // Address
  if (card.address || card.city || card.state || card.zip || card.country) {
    const adr = `ADR;TYPE=WORK:;;${card.address || ''};${card.city || ''};${card.state || ''};${card.zip || ''};${card.country || ''}`;
    lines.push(adr);
  }
  
  // Dynamic social links
  if (card.socials?.length) {
    card.socials.forEach(s => {
      let url = s.url;
      if (!url && SOCIAL_URL_TEMPLATES[s.platform]) {
        url = SOCIAL_URL_TEMPLATES[s.platform] + s.username.replace('@', '');
      }
      if (url) {
        lines.push(`X-SOCIALPROFILE;TYPE=${s.platform}:${url}`);
      }
    });
  } else {
    // Legacy fallback
    if (card.linkedin) {
      lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${card.linkedin}`);
    }
    if (card.twitter) {
      lines.push(`X-SOCIALPROFILE;TYPE=twitter:${card.twitter}`);
    }
    if (card.instagram) {
      lines.push(`X-SOCIALPROFILE;TYPE=instagram:${card.instagram}`);
    }
    if (card.facebook) {
      lines.push(`X-SOCIALPROFILE;TYPE=facebook:${card.facebook}`);
    }
  }
  
  if (card.bio) {
    lines.push(`NOTE:${card.bio.replace(/\n/g, '\\n')}`);
  }
  
  if (card.photo) {
    lines.push(`PHOTO;VALUE=URI:${card.photo}`);
  }
  
  lines.push('END:VCARD');
  
  return lines.join('\r\n');
}

// GET - List all business cards
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const vcard = req.nextUrl.searchParams.get('vcard');
  
  const data = await readData();
  
  // If requesting specific card
  if (id) {
    const card = data.cards.find(c => c.id === id);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    
    // If requesting vCard download
    if (vcard === 'true') {
      const vcardString = generateVCard(card);
      return new NextResponse(vcardString, {
        headers: {
          'Content-Type': 'text/vcard',
          'Content-Disposition': `attachment; filename="${card.name.replace(/\s+/g, '_')}.vcf"`,
        },
      });
    }
    
    return NextResponse.json({ card });
  }
  
  // Stats
  const stats = {
    total: data.cards.length,
    totalScans: data.cards.reduce((sum, c) => sum + (c.scanCount || 0), 0),
    totalSaves: data.cards.reduce((sum, c) => sum + (c.saveCount || 0), 0),
  };
  
  return NextResponse.json({ cards: data.cards, stats });
}

// POST - Create new business card
export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const newCard: BusinessCard = {
    id: `bcard-${Date.now()}`,
    name: body.name,
    title: body.title,
    company: body.company,
    bio: body.bio,
    photo: body.photo,
    logo: body.logo,
    
    // Dynamic contact fields
    emails: body.emails || [],
    phones: body.phones || [],
    websites: body.websites || [],
    socials: body.socials || [],
    
    // Legacy fields (populated from first entries for backwards compat)
    email: body.emails?.[0]?.email || body.email,
    phone: body.phones?.find((p: PhoneNumber) => p.type === 'work')?.number || body.phone,
    mobile: body.phones?.find((p: PhoneNumber) => p.type === 'mobile')?.number || body.mobile,
    website: body.websites?.[0]?.url || body.website,
    linkedin: body.socials?.find((s: SocialLink) => s.platform === 'linkedin')?.username || body.linkedin,
    twitter: body.socials?.find((s: SocialLink) => s.platform === 'twitter')?.username || body.twitter,
    instagram: body.socials?.find((s: SocialLink) => s.platform === 'instagram')?.username || body.instagram,
    facebook: body.socials?.find((s: SocialLink) => s.platform === 'facebook')?.username || body.facebook,
    
    address: body.address,
    city: body.city,
    state: body.state,
    zip: body.zip,
    country: body.country || 'USA',
    
    template: body.template || 'modern',
    qrShape: body.qrShape || 'square',
    qrColor: body.qrColor || '#000000',
    qrBgColor: body.qrBgColor || '#ffffff',
    bgColor: body.bgColor || '#1a1a2e',
    bgImage: body.bgImage || '',
    accentColor: body.accentColor || '#6366f1',
    
    // Advanced colors with smart defaults
    iconBgColor: body.iconBgColor || body.accentColor || '#6366f1',
    iconColor: body.iconColor || '#ffffff',
    sectionBgColor: body.sectionBgColor || 'rgba(255,255,255,0.1)',
    sectionTitleColor: body.sectionTitleColor || 'rgba(255,255,255,0.5)',
    contentColor: body.contentColor || '#ffffff',
    nameColor: body.nameColor || '#ffffff',
    titleColor: body.titleColor || 'rgba(255,255,255,0.8)',
    companyColor: body.companyColor || 'rgba(255,255,255,0.6)',
    bioColor: body.bioColor || 'rgba(255,255,255,0.7)',
    buttonBgColor: body.buttonBgColor || body.accentColor || '#6366f1',
    buttonTextColor: body.buttonTextColor || '#ffffff',
    
    nfcEnabled: body.nfcEnabled || false,
    nfcTagId: body.nfcTagId,
    
    scanCount: 0,
    saveCount: 0,
    shareCount: 0,
    nfcTapCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.cards.push(newCard);
  await writeData(data);
  
  return NextResponse.json({ success: true, card: newCard });
}

// PUT - Update business card
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.cards.findIndex(c => c.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }
  
  // Handle stat increments
  if (body.incrementScan) {
    data.cards[index].scanCount = (data.cards[index].scanCount || 0) + 1;
  } else if (body.incrementSave) {
    data.cards[index].saveCount = (data.cards[index].saveCount || 0) + 1;
  } else if (body.incrementShare) {
    data.cards[index].shareCount = (data.cards[index].shareCount || 0) + 1;
  } else if (body.incrementNfcTap) {
    data.cards[index].nfcTapCount = (data.cards[index].nfcTapCount || 0) + 1;
  } else {
    // Regular update - also update legacy fields from dynamic arrays
    const updatedCard = {
      ...data.cards[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    // Sync legacy fields if arrays provided
    if (body.emails?.length) {
      updatedCard.email = body.emails[0]?.email;
    }
    if (body.phones?.length) {
      updatedCard.phone = body.phones.find((p: PhoneNumber) => p.type === 'work')?.number;
      updatedCard.mobile = body.phones.find((p: PhoneNumber) => p.type === 'mobile')?.number;
    }
    if (body.websites?.length) {
      updatedCard.website = body.websites[0]?.url;
    }
    if (body.socials?.length) {
      updatedCard.linkedin = body.socials.find((s: SocialLink) => s.platform === 'linkedin')?.username;
      updatedCard.twitter = body.socials.find((s: SocialLink) => s.platform === 'twitter')?.username;
      updatedCard.instagram = body.socials.find((s: SocialLink) => s.platform === 'instagram')?.username;
      updatedCard.facebook = body.socials.find((s: SocialLink) => s.platform === 'facebook')?.username;
    }
    
    data.cards[index] = updatedCard;
  }
  
  await writeData(data);
  
  return NextResponse.json({ success: true, card: data.cards[index] });
}

// DELETE - Remove business card
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const data = await readData();
  
  const index = data.cards.findIndex(c => c.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }
  
  data.cards.splice(index, 1);
  await writeData(data);
  
  return NextResponse.json({ success: true });
}
